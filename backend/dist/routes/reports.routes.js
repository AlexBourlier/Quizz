import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { prisma } from "../config/prisma.js";
import { createReport } from "../services/reports.service.js";
const reportsRouter = Router();
reportsRouter.use(authMiddleware);
const reportSchema = z.object({
    reportedId: z.string().min(1),
    messageContent: z.string().max(4000).optional(),
    messageAt: z.string().datetime().optional(),
    context: z.enum(["chat", "dm", "user"]),
    reason: z.string().max(500).optional(),
});
reportsRouter.post("/", async (req, res) => {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
    const reporterId = req.user.sub;
    const { reportedId, messageContent, messageAt, context, reason } = parsed.data;
    if (reporterId === reportedId)
        return res.status(400).json({ message: "Impossible de se signaler soi-même" });
    const target = await prisma.user.findUnique({
        where: { id: reportedId },
        select: { role: { select: { name: true } } },
    });
    if (target?.role.name === "admin")
        return res.status(403).json({ message: "Impossible de signaler un administrateur" });
    const report = await createReport({
        reporterId,
        reportedId,
        messageContent,
        messageAt: messageAt ? new Date(messageAt) : undefined,
        context,
        reason,
    });
    return res.status(201).json(report);
});
export default reportsRouter;
