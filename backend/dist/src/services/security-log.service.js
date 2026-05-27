import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
function hashIp(ip) {
    return crypto.createHash("sha256").update(ip + "quizztest-ip-salt").digest("hex").slice(0, 32);
}
function retentionDate() {
    const d = new Date();
    d.setDate(d.getDate() + env.SECURITY_LOG_RETENTION_DAYS);
    return d;
}
export async function logSecurity(opts) {
    await prisma.securityLog.create({
        data: {
            event: opts.event,
            userId: opts.userId,
            ipHash: opts.ip ? hashIp(opts.ip) : undefined,
            userAgent: opts.userAgent ? opts.userAgent.slice(0, 512) : undefined,
            metadata: (opts.metadata ?? {}),
            expiresAt: retentionDate(),
        },
    });
}
export async function countRecentRegistrationsByIp(ip, withinMinutes = 60) {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);
    return prisma.securityLog.count({
        where: {
            ipHash: hashIp(ip),
            event: "register_success",
            createdAt: { gte: since },
        },
    });
}
export async function deleteExpiredSecurityLogs() {
    const { count } = await prisma.securityLog.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });
    if (count > 0)
        console.log(`[cleanup] ${count} security logs expirés supprimés`);
}
