import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import {
  addReaction,
  createMessage,
  deleteMessage,
  editMessage
} from "../services/messages.service.js";
import {
  banUser,
  checkBanned,
  checkMuted,
  muteUser,
  promoteToMod,
  unbanUser
} from "../services/moderation.service.js";
import { getDmContacts, getDmHistory, markDmsRead, sendDm } from "../services/dm.service.js";
import {
  canAccessRoom,
  inviteUserToRoom,
  isRoomModerator,
  joinRoom,
  leaveRoom
} from "../services/rooms.service.js";
import { quizBotEngine } from "../services/quiz-bot.service.js";
import { getLeaderboard } from "../services/quiz.service.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";

const spamTracker = new Map<string, number[]>();

async function getRoomUsers(io: Server, roomId: string) {
  const sockets = await io.in(roomId).fetchSockets();
  const socketUsers = sockets.map((s) => ({
    id: s.data.user?.sub as string,
    username: s.data.user?.username as string,
    role: s.data.user?.role as string
  }));

  const roomMods = await prisma.roomModerator.findMany({
    where: { roomId },
    select: { userId: true }
  });
  const roomModIds = new Set(roomMods.map((m: { userId: string }) => m.userId));

  const users = socketUsers.map((u) => ({ ...u, isRoomMod: roomModIds.has(u.id) }));

  users.sort((a, b) => {
    const rank = (u: typeof a) => {
      if (u.role === "admin") return 0;
      if (u.role === "moderator" || u.isRoomMod) return 1;
      return 2;
    };
    const diff = rank(a) - rank(b);
    return diff !== 0 ? diff : a.username.localeCompare(b.username, "fr");
  });

  return users;
}

async function broadcastRoomCount(io: Server, roomId: string) {
  const count = (await io.in(roomId).fetchSockets()).length;
  io.emit("room:count-updated", { roomId, count });
}

function isSpam(socketId: string) {
  const now = Date.now();
  const timeline = (spamTracker.get(socketId) ?? []).filter((t) => now - t < 10_000);
  timeline.push(now);
  spamTracker.set(socketId, timeline);
  return timeline.length > 12;
}

async function canModerateInRoom(role: string, userId: string, roomId: string): Promise<boolean> {
  if (role === "admin" || role === "moderator") return true;
  return isRoomModerator(roomId, userId);
}

export function buildSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
    transports: ["websocket", "polling"]
  });

  io.use((socket, next) => {
    const token =
      typeof socket.handshake.auth?.token === "string"
        ? socket.handshake.auth.token
        : socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("Unauthorized"));

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.user.role === "admin") {
      quizBotEngine.autoStartInRoom(io, "quiz-arena").catch(() => undefined);
    }

    // ── Room ─────────────────────────────────────────────────
    socket.on("room:join", async ({ roomId }, callback) => {
      try {
        const user = socket.data.user;
        const access = await canAccessRoom(roomId, user.sub, user.role as string);
        if (!access) {
          callback?.({ ok: false, message: "Access denied" });
          return;
        }

        await joinRoom(roomId, user.sub);
        socket.join(roomId);

        callback?.({ ok: true, messages: [] });

        const users = await getRoomUsers(io, roomId);
        io.to(roomId).emit("room:users-updated", { roomId, users });
        await broadcastRoomCount(io, roomId);
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("room:leave", async ({ roomId }) => {
      const user = socket.data.user;
      await leaveRoom(roomId, user.sub);
      socket.leave(roomId);
      const users = await getRoomUsers(io, roomId);
      io.to(roomId).emit("room:users-updated", { roomId, users });
      await broadcastRoomCount(io, roomId);
    });

    // ── Typing ────────────────────────────────────────────────
    socket.on("typing:start", ({ roomId }) => {
      socket.to(roomId).emit("typing:update", {
        roomId,
        userId: socket.data.user.sub,
        username: socket.data.user.username,
        typing: true
      });
    });

    socket.on("typing:stop", ({ roomId }) => {
      socket.to(roomId).emit("typing:update", {
        roomId,
        userId: socket.data.user.sub,
        username: socket.data.user.username,
        typing: false
      });
    });

    // ── Messages ──────────────────────────────────────────────
    socket.on("message:send", async ({ roomId, content }, callback) => {
      try {
        if (isSpam(socket.id)) {
          callback?.({ ok: false, message: "Spam detected" });
          return;
        }

        const user = socket.data.user;

        if (await checkBanned(user.sub)) {
          callback?.({ ok: false, message: "Compte banni" });
          return;
        }
        if (await checkMuted(user.sub)) {
          callback?.({ ok: false, message: "Vous êtes temporairement muet" });
          return;
        }

        const access = await canAccessRoom(roomId, user.sub, user.role as string);
        if (!access) {
          callback?.({ ok: false, message: "Access denied" });
          return;
        }

        const safeContent = String(content ?? "").trim();
        if (!safeContent) {
          callback?.({ ok: false, message: "Message empty" });
          return;
        }

        const message = await createMessage({ roomId, userId: user.sub, content: safeContent });
        io.to(roomId).emit("message:new", message);
        callback?.({ ok: true, message });

        await quizBotEngine.submitAnswer(io, socket, {
          roomId,
          answer: safeContent,
          userId: user.sub,
          username: user.username
        });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("message:edit", async ({ messageId, content, roomId }, callback) => {
      try {
        const user = socket.data.user;
        const canMod = await canModerateInRoom(user.role as string, user.sub, roomId);
        const message = await editMessage(messageId, user.sub, String(content), canMod);
        io.to(roomId).emit("message:updated", message);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("message:delete", async ({ messageId, roomId }, callback) => {
      try {
        const user = socket.data.user;
        const canMod = await canModerateInRoom(user.role as string, user.sub, roomId);
        await deleteMessage(messageId, user.sub, canMod);
        io.to(roomId).emit("message:deleted", { messageId });
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("message:react", async ({ messageId, roomId, emoji }, callback) => {
      try {
        const user = socket.data.user;
        const reactions = await addReaction(messageId, user.sub, emoji);
        io.to(roomId).emit("message:reactions", { messageId, reactions });
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    // ── Modération ────────────────────────────────────────────
    socket.on("mod:ban", async ({ username, roomId = "" }, callback) => {
      try {
        const user = socket.data.user;
        const canMod = await canModerateInRoom(user.role as string, user.sub, roomId);
        if (!canMod) {
          callback?.({ ok: false, message: "Insufficient role" });
          return;
        }
        const banned = await banUser(username);
        const all = await io.fetchSockets();
        for (const s of all) {
          if (s.data.user?.sub === banned.id) {
            s.emit("mod:banned", { reason: "Vous avez été banni" });
            s.disconnect(true);
          }
        }
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on("mod:unban", async ({ username, roomId = "" }, callback) => {
      try {
        const user = socket.data.user;
        const canMod = await canModerateInRoom(user.role as string, user.sub, roomId);
        if (!canMod) {
          callback?.({ ok: false, message: "Insufficient role" });
          return;
        }
        await unbanUser(username);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on("mod:timeout", async ({ username, minutes = 10, roomId = "" }, callback) => {
      try {
        const user = socket.data.user;
        const canMod = await canModerateInRoom(user.role as string, user.sub, roomId);
        if (!canMod) {
          callback?.({ ok: false, message: "Insufficient role" });
          return;
        }
        const { user: muted, mutedUntil } = await muteUser(username, minutes);
        const all = await io.fetchSockets();
        for (const s of all) {
          if (s.data.user?.sub === muted.id) {
            s.emit("mod:muted", { minutes, until: mutedUntil });
          }
        }
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on("mod:kick", async ({ username, roomId }, callback) => {
      try {
        const user = socket.data.user;
        const canMod = await canModerateInRoom(user.role as string, user.sub, roomId);
        if (!canMod) {
          callback?.({ ok: false, message: "Insufficient role" });
          return;
        }
        const all = await io.in(roomId).fetchSockets();
        for (const s of all) {
          if (s.data.user?.username === username) {
            s.emit("mod:kicked", { roomId });
            s.leave(roomId);
          }
        }
        const users = await getRoomUsers(io, roomId);
        io.to(roomId).emit("room:users-updated", { roomId, users });
        await broadcastRoomCount(io, roomId);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on("mod:promote", async ({ username }, callback) => {
      try {
        if (socket.data.user.role !== "admin") {
          callback?.({ ok: false, message: "Seul un admin peut promouvoir" });
          return;
        }
        const { user, accessToken, refreshToken } = await promoteToMod(username);

        const allSockets = await io.fetchSockets();
        for (const s of allSockets) {
          if (s.data.user?.sub === user.id) {
            s.data.user = { ...s.data.user, role: "moderator" };
            s.emit("mod:promoted", { accessToken, refreshToken });
          }
        }
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    // ── Room invite (admin → user) ─────────────────────────────
    socket.on("room:invite", async ({ roomId, username }, callback) => {
      try {
        if (socket.data.user.role !== "admin") {
          callback?.({ ok: false, message: "Réservé à l'admin" });
          return;
        }
        const target = await prisma.user.findUnique({
          where: { username },
          select: { id: true, username: true }
        });
        if (!target) {
          callback?.({ ok: false, message: "Utilisateur introuvable" });
          return;
        }
        const room = await inviteUserToRoom(roomId, target.id, socket.data.user.sub);

        // Notify invited user's active sockets
        const allSockets = await io.fetchSockets();
        for (const s of allSockets) {
          if (s.data.user?.sub === target.id) {
            s.emit("room:invited", { room });
          }
        }
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    // ── Messages privés ───────────────────────────────────────
    socket.on("dm:send", async ({ recipientUsername, content }, callback) => {
      try {
        const user = socket.data.user;
        const { dm, recipientId, plainContent } = await sendDm(user.sub, recipientUsername, String(content));

        const outgoing = {
          id: dm.id,
          content: plainContent,
          createdAt: dm.createdAt,
          sender: dm.sender,
          recipientId
        };

        socket.emit("dm:received", outgoing);

        const allSockets = await io.fetchSockets();
        for (const s of allSockets) {
          if (s.data.user?.sub === recipientId) {
            s.emit("dm:received", outgoing);
          }
        }
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on("dm:history", async ({ withUserId }, callback) => {
      try {
        const userId = socket.data.user.sub;
        const messages = await getDmHistory(userId, withUserId);
        await markDmsRead(userId, withUserId);
        callback?.({ ok: true, messages });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    socket.on("dm:contacts", async (_payload, callback) => {
      try {
        const contacts = await getDmContacts(socket.data.user.sub);
        callback?.({ ok: true, contacts });
      } catch (error) {
        callback?.({ ok: false, message: (error as Error).message });
      }
    });

    // ── Quiz ──────────────────────────────────────────────────
    socket.on("quiz:start", async ({ roomId, categories, difficulty }, callback) => {
      try {
        const role = socket.data.user.role as string;
        if (role !== "admin" && role !== "moderator") {
          callback?.({ ok: false, message: "Insufficient role" });
          return;
        }
        const cats = Array.isArray(categories) && categories.length > 0 ? categories : undefined;
        await quizBotEngine.start(io, roomId, { categories: cats, difficulty });
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("quiz:stop", ({ roomId }, callback) => {
      try {
        const role = socket.data.user.role as string;
        if (role !== "admin" && role !== "moderator") {
          callback?.({ ok: false, message: "Insufficient role" });
          return;
        }
        quizBotEngine.stop(roomId);
        io.to(roomId).emit("quiz:ended", { roomId, reason: "Stopped by moderator" });
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("quiz:answer", async ({ roomId, answer }, callback) => {
      const user = socket.data.user;
      const result = await quizBotEngine.submitAnswer(io, socket, {
        roomId,
        answer: String(answer),
        userId: user.sub,
        username: user.username
      });
      callback?.(result);
    });

    socket.on("quiz:leaderboard", async (_payload, callback) => {
      const leaderboard = await getLeaderboard(10);
      callback?.({ ok: true, leaderboard });
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on("disconnect", () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      setTimeout(async () => {
        for (const roomId of rooms) {
          const users = await getRoomUsers(io, roomId);
          io.to(roomId).emit("room:users-updated", { roomId, users });
          await broadcastRoomCount(io, roomId);
        }
      }, 200);
    });
  });

  return io;
}
