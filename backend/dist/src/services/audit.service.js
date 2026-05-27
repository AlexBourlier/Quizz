import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
function auditExpiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + env.AUDIT_LOG_RETENTION_DAYS);
    return d;
}
export async function logAudit(opts) {
    await prisma.adminAuditLog.create({
        data: {
            adminId: opts.adminId,
            action: opts.action,
            targetUserId: opts.targetUserId,
            targetMessageId: opts.targetMessageId,
            ipAddress: opts.ipAddress,
            reason: opts.reason,
            metadata: (opts.metadata ?? {}),
            expiresAt: auditExpiresAt(),
        },
    });
}
export async function getAuditLogs(opts) {
    return prisma.adminAuditLog.findMany({
        where: {
            ...(opts.adminId ? { adminId: opts.adminId } : {}),
            ...(opts.action ? { action: opts.action } : {}),
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        take: opts.limit ?? 50,
        skip: opts.offset ?? 0,
        include: {
            admin: { select: { id: true, username: true } },
        },
    });
}
