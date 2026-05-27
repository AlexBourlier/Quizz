import { Router } from "express";
import { z } from "zod";
import { createRoomController, joinRoomController, leaveRoomController, listRoomsController } from "../controllers/rooms.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { addRoomModerator, deleteRoom, editRoom, getRoomModerators, inviteUserToRoom, removeRoomModerator } from "../services/rooms.service.js";
import { prisma } from "../config/prisma.js";
const roomsRouter = Router();
roomsRouter.use(authMiddleware);
roomsRouter.get("/", listRoomsController);
roomsRouter.post("/", requireRole(["admin", "moderator"]), createRoomController);
roomsRouter.post("/:roomId/join", joinRoomController);
roomsRouter.post("/:roomId/leave", leaveRoomController);
const editSchema = z.object({
    name: z.string().min(1).max(64).optional(),
    type: z.enum(["public", "private", "restricted"]).optional(),
    rules: z.string().max(1000).nullable().optional(),
    ageLimit: z.number().int().min(0).nullable().optional(),
    maxOccupants: z.number().int().min(1).nullable().optional()
});
roomsRouter.patch("/:roomId", requireRole(["admin"]), async (req, res) => {
    try {
        const data = editSchema.parse(req.body);
        const room = await editRoom(req.params.roomId, data);
        return res.json(room);
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
});
roomsRouter.delete("/:roomId", requireRole(["admin"]), async (req, res) => {
    try {
        await deleteRoom(req.params.roomId);
        return res.json({ ok: true });
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
});
roomsRouter.post("/:roomId/invite", requireRole(["admin"]), async (req, res) => {
    try {
        const { username } = z.object({ username: z.string() }).parse(req.body);
        const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
        if (!target)
            return res.status(404).json({ message: "Utilisateur introuvable" });
        const room = await inviteUserToRoom(req.params.roomId, target.id, req.user.sub);
        return res.json(room);
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
});
roomsRouter.get("/:roomId/moderators", requireRole(["admin"]), async (req, res) => {
    const mods = await getRoomModerators(req.params.roomId);
    return res.json(mods);
});
roomsRouter.post("/:roomId/moderators", requireRole(["admin"]), async (req, res) => {
    try {
        const { username } = z.object({ username: z.string() }).parse(req.body);
        const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
        if (!target)
            return res.status(404).json({ message: "Utilisateur introuvable" });
        const mod = await addRoomModerator(req.params.roomId, target.id);
        return res.json(mod);
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
});
roomsRouter.delete("/:roomId/moderators/:userId", requireRole(["admin"]), async (req, res) => {
    await removeRoomModerator(req.params.roomId, req.params.userId);
    return res.json({ ok: true });
});
export default roomsRouter;
