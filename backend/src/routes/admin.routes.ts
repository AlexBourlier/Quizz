import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { prisma } from "../config/prisma.js";
import { getReports, resolveReport } from "../services/reports.service.js";
import { approveAvatar, rejectAvatar } from "../services/users.service.js";

const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireRole(["admin"]));

adminRouter.get("/moderators", async (_req: Request, res: Response) => {
  const modRole = await prisma.role.findUnique({ where: { name: "moderator" } });
  if (!modRole) return res.json([]);

  const mods = await prisma.user.findMany({
    where: { roleId: modRole.id },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      roomMemberships: {
        select: { room: { select: { id: true, name: true, type: true } } }
      }
    },
    orderBy: { username: "asc" }
  });

  return res.json(mods.map((m) => ({
    id: m.id,
    username: m.username,
    email: m.email,
    createdAt: m.createdAt,
    rooms: m.roomMemberships.map((rm) => rm.room)
  })));
});

adminRouter.delete("/moderators/:userId/demote", async (req: Request, res: Response) => {
  const userRole = await prisma.role.findUnique({ where: { name: "user" } });
  if (!userRole) return res.status(500).json({ message: "Role user introuvable" });
  await prisma.user.update({
    where: { id: req.params.userId },
    data: { roleId: userRole.id }
  });
  return res.json({ ok: true });
});

adminRouter.get("/reports", async (req: Request, res: Response) => {
  const resolved =
    req.query.resolved === "true" ? true
    : req.query.resolved === "false" ? false
    : undefined;
  const reports = await getReports(resolved);
  return res.json(reports);
});

adminRouter.patch("/reports/:reportId/resolve", async (req: Request, res: Response) => {
  const report = await resolveReport(req.params.reportId);
  return res.json(report);
});

// Pending avatar approvals
adminRouter.get("/avatars/pending", async (_req: Request, res: Response) => {
  const pending = await prisma.user.findMany({
    where: { pendingAvatar: { not: null } },
    select: { id: true, username: true, pendingAvatar: true, avatar: true }
  });
  return res.json(pending);
});

adminRouter.patch("/avatars/:userId/approve", async (req: Request, res: Response) => {
  try {
    const user = await approveAvatar(req.params.userId);
    // Notify the user's active sockets in real-time
    const io = req.app.get("io");
    if (io) {
      const allSockets = await io.fetchSockets();
      for (const s of allSockets) {
        if (s.data.user?.sub === req.params.userId) {
          s.emit("user:profile-updated", { avatar: user.avatar });
        }
      }
    }
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});

adminRouter.patch("/avatars/:userId/reject", async (req: Request, res: Response) => {
  const user = await rejectAvatar(req.params.userId);
  return res.json(user);
});

// List all users (for invite/mod selection)
adminRouter.get("/users", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, avatar: true },
    orderBy: { username: "asc" }
  });
  return res.json(users);
});

// List all rooms with their mods
adminRouter.get("/rooms", async (_req: Request, res: Response) => {
  const rooms = await prisma.room.findMany({
    include: {
      moderators: {
        include: { user: { select: { id: true, username: true } } }
      }
    },
    orderBy: { createdAt: "asc" }
  });
  return res.json(rooms);
});

export default adminRouter;
