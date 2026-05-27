import { Server } from "socket.io";
import { env } from "../config/env.js";
import { addReaction, createMessage, deleteMessage, editMessage } from "../services/messages.service.js";
import { banUser, checkBanned, checkMuted, muteUser, promoteToMod, unbanUser } from "../services/moderation.service.js";
import { getDmContacts, getDmHistory, markDmsRead, sendDm } from "../services/dm.service.js";
import { canAccessRoom, joinRoom, leaveRoom } from "../services/rooms.service.js";
import { quizBotEngine } from "../services/quiz-bot.service.js";
import { getLeaderboard } from "../services/quiz.service.js";
import { verifyAccessToken } from "../utils/jwt.js";
const spamTracker = new Map();
async function getRoomUsers(io, roomId) {
    const sockets = await io.in(roomId).fetchSockets();
    return sockets.map((s) => ({
        id: s.data.user?.sub,
        username: s.data.user?.username,
        role: s.data.user?.role
    }));
}
async function broadcastRoomCount(io, roomId) {
    const count = (await io.in(roomId).fetchSockets()).length;
    io.emit("room:count-updated", { roomId, count });
}
function isSpam(socketId) {
    const now = Date.now();
    const timeline = (spamTracker.get(socketId) ?? []).filter((t) => now - t < 10_000);
    timeline.push(now);
    spamTracker.set(socketId, timeline);
    return timeline.length > 12;
}
export function buildSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: { origin: env.FRONTEND_URL, credentials: true },
        transports: ["websocket", "polling"]
    });
    io.use((socket, next) => {
        const token = typeof socket.handshake.auth?.token === "string"
            ? socket.handshake.auth.token
            : socket.handshake.headers.authorization?.replace("Bearer ", "");
        if (!token)
            return next(new Error("Unauthorized"));
        try {
            const payload = verifyAccessToken(token);
            socket.data.user = payload;
            return next();
        }
        catch {
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
                const access = await canAccessRoom(roomId, user.sub, user.role);
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
            }
            catch (error) {
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
                const access = await canAccessRoom(roomId, user.sub, user.role);
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
            }
            catch (error) {
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
            }
            catch (error) {
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
            }
            catch (error) {
                callback?.({ ok: false, message: String(error) });
            }
        });
        socket.on("message:react", async ({ messageId, roomId, emoji }, callback) => {
            try {
                const user = socket.data.user;
                const reactions = await addReaction(messageId, user.sub, emoji);
                io.to(roomId).emit("message:reactions", { messageId, reactions });
                callback?.({ ok: true });
            }
            catch (error) {
                callback?.({ ok: false, message: String(error) });
            }
        });
        // ── Modération ────────────────────────────────────────────
        socket.on("mod:ban", async ({ username }, callback) => {
            try {
                const role = socket.data.user.role;
                if (role !== "admin" && role !== "moderator") {
                    callback?.({ ok: false, message: "Insufficient role" });
                    return;
                }
                const banned = await banUser(username);
                // Kick all sockets of banned user
                const all = await io.fetchSockets();
                for (const s of all) {
                    if (s.data.user?.sub === banned.id) {
                        s.emit("mod:banned", { reason: "Vous avez été banni" });
                        s.disconnect(true);
                    }
                }
                callback?.({ ok: true });
            }
            catch (error) {
                callback?.({ ok: false, message: error.message });
            }
        });
        socket.on("mod:unban", async ({ username }, callback) => {
            try {
                const role = socket.data.user.role;
                if (role !== "admin" && role !== "moderator") {
                    callback?.({ ok: false, message: "Insufficient role" });
                    return;
                }
                await unbanUser(username);
                callback?.({ ok: true });
            }
            catch (error) {
                callback?.({ ok: false, message: error.message });
            }
        });
        socket.on("mod:timeout", async ({ username, minutes = 10 }, callback) => {
            try {
                const role = socket.data.user.role;
                if (role !== "admin" && role !== "moderator") {
                    callback?.({ ok: false, message: "Insufficient role" });
                    return;
                }
                const { user, mutedUntil } = await muteUser(username, minutes);
                const all = await io.fetchSockets();
                for (const s of all) {
                    if (s.data.user?.sub === user.id) {
                        s.emit("mod:muted", { minutes, until: mutedUntil });
                    }
                }
                callback?.({ ok: true });
            }
            catch (error) {
                callback?.({ ok: false, message: error.message });
            }
        });
        socket.on("mod:kick", async ({ username, roomId }, callback) => {
            try {
                const role = socket.data.user.role;
                if (role !== "admin" && role !== "moderator") {
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
            }
            catch (error) {
                callback?.({ ok: false, message: error.message });
            }
        });
        socket.on("mod:promote", async ({ username }, callback) => {
            try {
                if (socket.data.user.role !== "admin") {
                    callback?.({ ok: false, message: "Seul un admin peut promouvoir" });
                    return;
                }
                const { user, accessToken, refreshToken } = await promoteToMod(username);
                // Update server-side socket data immediately (no reconnect needed)
                const allSockets = await io.fetchSockets();
                for (const s of allSockets) {
                    if (s.data.user?.sub === user.id) {
                        s.data.user = { ...s.data.user, role: "moderator" };
                        s.emit("mod:promoted", { accessToken, refreshToken });
                    }
                }
                callback?.({ ok: true });
            }
            catch (error) {
                callback?.({ ok: false, message: error.message });
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
                    recipientId,
                };
                // Echo to sender
                socket.emit("dm:received", outgoing);
                // Deliver to recipient's active sockets
                const allSockets = await io.fetchSockets();
                for (const s of allSockets) {
                    if (s.data.user?.sub === recipientId) {
                        s.emit("dm:received", outgoing);
                    }
                }
                callback?.({ ok: true });
            }
            catch (error) {
                callback?.({ ok: false, message: error.message });
            }
        });
        socket.on("dm:history", async ({ withUserId }, callback) => {
            try {
                const userId = socket.data.user.sub;
                const messages = await getDmHistory(userId, withUserId);
                await markDmsRead(userId, withUserId);
                callback?.({ ok: true, messages });
            }
            catch (error) {
                callback?.({ ok: false, message: error.message });
            }
        });
        socket.on("dm:contacts", async (_payload, callback) => {
            try {
                const contacts = await getDmContacts(socket.data.user.sub);
                callback?.({ ok: true, contacts });
            }
            catch (error) {
                callback?.({ ok: false, message: error.message });
            }
        });
        // ── Quiz ──────────────────────────────────────────────────
        socket.on("quiz:start", async ({ roomId, category, difficulty }, callback) => {
            try {
                const role = socket.data.user.role;
                if (role !== "admin" && role !== "moderator") {
                    callback?.({ ok: false, message: "Insufficient role" });
                    return;
                }
                await quizBotEngine.start(io, roomId, { category, difficulty });
                callback?.({ ok: true });
            }
            catch (error) {
                callback?.({ ok: false, message: String(error) });
            }
        });
        socket.on("quiz:stop", ({ roomId }, callback) => {
            try {
                const role = socket.data.user.role;
                if (role !== "admin" && role !== "moderator") {
                    callback?.({ ok: false, message: "Insufficient role" });
                    return;
                }
                quizBotEngine.stop(roomId);
                io.to(roomId).emit("quiz:ended", { roomId, reason: "Stopped by moderator" });
                callback?.({ ok: true });
            }
            catch (error) {
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
