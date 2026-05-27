import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { prisma } from "../config/prisma.js";
import { decrypt } from "../services/encryption.service.js";
import { logAudit, getAuditLogs } from "../services/audit.service.js";
import { reportDm } from "../services/dm.service.js";

const moderationRouter = Router();
moderationRouter.use(authMiddleware);
moderationRouter.use(requireRole(["admin", "moderator"]));

function getIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown"
  );
}

// ── List reported DM messages ─────────────────────────────────────────────────

moderationRouter.get("/reported-messages", async (req: Request, res: Response) => {
  const { status, limit = "50", offset = "0" } = req.query as Record<string, string>;

  const reports = await prisma.reportedMessage.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      originalMessageId: true,
      senderId: true,
      recipientId: true,
      reporterId: true,
      reason: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      resolvedAt: true,
      moderatorNote: true,
      sender:    { select: { username: true } },
      recipient: { select: { username: true } },
      reporter:  { select: { username: true } },
      reviewer:  { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
    take:   Number(limit),
    skip:   Number(offset),
  });

  await logAudit({
    adminId:   req.user!.sub,
    action:    "view_reported_message",
    ipAddress: getIp(req),
    metadata:  { count: reports.length, status },
  });

  return res.json(reports);
});

// ── Decrypt a reported message (admin/moderator only, always audited) ─────────

moderationRouter.get("/reported-messages/:id/decrypt", requireRole(["admin"]), async (req: Request, res: Response) => {
  const report = await prisma.reportedMessage.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, encryptedContent: true, iv: true, authTag: true, keyVersion: true,
      senderId: true, recipientId: true,
      sender:    { select: { username: true } },
      recipient: { select: { username: true } },
    },
  });

  if (!report) return res.status(404).json({ message: "Signalement introuvable" });

  let plainContent: string;
  try {
    plainContent = decrypt({
      content:    report.encryptedContent,
      iv:         report.iv,
      authTag:    report.authTag,
      keyVersion: report.keyVersion,
    });
  } catch {
    return res.status(500).json({ message: "Impossible de déchiffrer le message" });
  }

  await logAudit({
    adminId:         req.user!.sub,
    action:          "decrypt_message",
    targetUserId:    report.senderId,
    targetMessageId: report.id,
    ipAddress:       getIp(req),
    reason:          req.query.reason as string | undefined,
    metadata:        { reportId: report.id },
  });

  return res.json({
    id:              report.id,
    plainContent,
    senderUsername:    report.sender.username,
    recipientUsername: report.recipient.username,
  });
});

// ── Review a report (accept / dismiss) ───────────────────────────────────────

const reviewSchema = z.object({
  status:       z.enum(["reviewed", "actioned", "dismissed"]),
  moderatorNote: z.string().max(1000).optional(),
});

moderationRouter.patch("/reported-messages/:id", async (req: Request, res: Response) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  const updated = await prisma.reportedMessage.update({
    where: { id: req.params.id },
    data:  {
      status:        parsed.data.status,
      moderatorNote: parsed.data.moderatorNote,
      reviewedById:  req.user!.sub,
      resolvedAt:    new Date(),
    },
  });

  await logAudit({
    adminId:         req.user!.sub,
    action:          "review_report",
    targetMessageId: req.params.id,
    ipAddress:       getIp(req),
    reason:          parsed.data.moderatorNote,
    metadata:        { newStatus: parsed.data.status },
  });

  return res.json(updated);
});

// ── Audit logs (admin only) ───────────────────────────────────────────────────

moderationRouter.get("/audit-logs", requireRole(["admin"]), async (req: Request, res: Response) => {
  const { adminId, action, limit = "100", offset = "0" } = req.query as Record<string, string>;

  const logs = await getAuditLogs({
    adminId: adminId || undefined,
    action:  (action as import("../services/audit.service.js").AuditAction) || undefined,
    limit:   Number(limit),
    offset:  Number(offset),
  });

  return res.json(logs);
});

// ── User: report a DM ─────────────────────────────────────────────────────────

moderationRouter.use(requireRole(["user", "moderator", "admin"]));  // allow all auth users below

export default moderationRouter;

// Separate user-facing router for filing DM reports (no mod role required)
export const dmReportRouter = Router();
dmReportRouter.use(authMiddleware);

const dmReportSchema = z.object({
  messageId: z.string().min(1),
  reason:    z.string().max(500).optional(),
});

dmReportRouter.post("/", async (req: Request, res: Response) => {
  const parsed = dmReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Données invalides" });

  try {
    const report = await reportDm({
      messageId:  parsed.data.messageId,
      reporterId: req.user!.sub,
      reason:     parsed.data.reason,
    });
    return res.status(201).json({ ok: true, id: report.id });
  } catch (err) {
    return res.status(400).json({ message: (err as Error).message });
  }
});
