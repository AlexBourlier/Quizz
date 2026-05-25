import { RoleName } from "@prisma/client";
import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import {
  addReaction,
  createMessage,
  deleteMessage,
  editMessage,
  getRoomMessages
} from "../services/messages.service.js";
import { canAccessRoom, joinRoom, leaveRoom } from "../services/rooms.service.js";
import { quizBotEngine } from "../services/quiz-bot.service.js";
import { getLeaderboard } from "../services/quiz.service.js";
import { verifyAccessToken } from "../utils/jwt.js";

const spamTracker = new Map<string, number[]>();

function isSpam(socketId: string) {
  const now = Date.now();
  const timeline = (spamTracker.get(socketId) ?? []).filter((timestamp) => now - timestamp < 10_000);
  timeline.push(now);
  spamTracker.set(socketId, timeline);
  return timeline.length > 12;
}

export function buildSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true
    },
    transports: ["websocket", "polling"]
  });

  io.use((socket, next) => {
    const token =
      typeof socket.handshake.auth?.token === "string"
        ? socket.handshake.auth.token
        : socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:join", async ({ roomId }, callback) => {
      try {
        const user = socket.data.user;
        const access = await canAccessRoom(roomId, user.sub, user.role as RoleName);
        if (!access) {
          callback?.({ ok: false, message: "Access denied" });
          return;
        }

        await joinRoom(roomId, user.sub);
        socket.join(roomId);
        io.to(roomId).emit("room:user-joined", { roomId, userId: user.sub, username: user.username });

        const messages = await getRoomMessages(roomId);
        callback?.({ ok: true, messages });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("room:leave", async ({ roomId }) => {
      const user = socket.data.user;
      await leaveRoom(roomId, user.sub);
      socket.leave(roomId);
      io.to(roomId).emit("room:user-left", { roomId, userId: user.sub });
    });

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

    socket.on("message:send", async ({ roomId, content }, callback) => {
      try {
        if (isSpam(socket.id)) {
          callback?.({ ok: false, message: "Spam detected" });
          return;
        }

        const user = socket.data.user;
        const access = await canAccessRoom(roomId, user.sub, user.role as RoleName);
        if (!access) {
          callback?.({ ok: false, message: "Access denied" });
          return;
        }

        const safeContent = String(content ?? "").trim();
        if (!safeContent) {
          callback?.({ ok: false, message: "Message empty" });
          return;
        }

        const message = await createMessage({
          roomId,
          userId: user.sub,
          content: safeContent
        });

        io.to(roomId).emit("message:new", message);
        callback?.({ ok: true, message });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("message:edit", async ({ messageId, content, roomId }, callback) => {
      try {
        const user = socket.data.user;
        const canModerate = user.role === "admin" || user.role === "moderator";
        const message = await editMessage(messageId, user.sub, String(content), canModerate);
        io.to(roomId).emit("message:updated", message);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: String(error) });
      }
    });

    socket.on("message:delete", async ({ messageId, roomId }, callback) => {
      try {
        const user = socket.data.user;
        const canModerate = user.role === "admin" || user.role === "moderator";
        await deleteMessage(messageId, user.sub, canModerate);
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

    socket.on("quiz:start", async ({ roomId, category, difficulty }, callback) => {
      try {
        const role = socket.data.user.role as RoleName;
        if (role !== RoleName.admin && role !== RoleName.moderator) {
          callback?.({ ok: false, message: "Insufficient role" });
          return;
        }

        await quizBotEngine.start(io, roomId, { category, difficulty });
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

    socket.on("disconnect", () => undefined);
  });

  return io;
}
