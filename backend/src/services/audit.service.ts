import { prisma } from "../config/prisma.js";

export type AuditAction =
  | "view_reported_message"
  | "decrypt_message"
  | "export_data"
  | "delete_message"
  | "ban_user"
  | "unban_user"
  | "promote_user"
  | "review_report"
  | "access_dm_history"
  | "rotate_encryption_key"
  | "modify_permissions";
import { env } from "../config/env.js";

type AuditOptions = {
  adminId: string;
  action: AuditAction;
  targetUserId?: string;
  targetMessageId?: string;
  ipAddress?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

function auditExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + env.AUDIT_LOG_RETENTION_DAYS);
  return d;
}

export async function logAudit(opts: AuditOptions): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      adminId:         opts.adminId,
      action:          opts.action,
      targetUserId:    opts.targetUserId,
      targetMessageId: opts.targetMessageId,
      ipAddress:       opts.ipAddress,
      reason:          opts.reason,
      metadata:        (opts.metadata ?? {}) as object,
      expiresAt:       auditExpiresAt(),
    },
  });
}

export async function getAuditLogs(opts: {
  adminId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}) {
  return prisma.adminAuditLog.findMany({
    where: {
      ...(opts.adminId ? { adminId: opts.adminId } : {}),
      ...(opts.action  ? { action:  opts.action  } : {}),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take:   opts.limit  ?? 50,
    skip:   opts.offset ?? 0,
    include: {
      admin: { select: { id: true, username: true } },
    },
  });
}
