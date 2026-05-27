import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { prisma } from "../config/prisma.js";
import { getReports, resolveReport } from "../services/reports.service.js";
const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireRole(["admin"]));
adminRouter.get("/moderators", async (_req, res) => {
    const modRole = await prisma.role.findUnique({ where: { name: "moderator" } });
    if (!modRole)
        return res.json([]);
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
adminRouter.delete("/moderators/:userId/demote", async (req, res) => {
    const userRole = await prisma.role.findUnique({ where: { name: "user" } });
    if (!userRole)
        return res.status(500).json({ message: "Role user introuvable" });
    await prisma.user.update({
        where: { id: req.params.userId },
        data: { roleId: userRole.id }
    });
    return res.json({ ok: true });
});
adminRouter.get("/reports", async (req, res) => {
    const resolved = req.query.resolved === "true" ? true
        : req.query.resolved === "false" ? false
            : undefined;
    const reports = await getReports(resolved);
    return res.json(reports);
});
adminRouter.patch("/reports/:reportId/resolve", async (req, res) => {
    const report = await resolveReport(req.params.reportId);
    return res.json(report);
});
export default adminRouter;
