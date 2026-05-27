import { prisma } from "../config/prisma.js";
import { deleteExpiredSecurityLogs } from "../services/security-log.service.js";

async function deleteExpiredDms() {
  const now = new Date();

  // Only delete messages that have no pending report referencing them
  const pendingReportedIds = await prisma.reportedMessage
    .findMany({ where: { status: "pending", originalMessageId: { not: null } }, select: { originalMessageId: true } })
    .then((rows: { originalMessageId: string | null }[]) => rows.map((r) => r.originalMessageId!));

  const { count: dmCount } = await prisma.privateMessage.deleteMany({
    where: {
      expiresAt: { lt: now },
      id: { notIn: pendingReportedIds },
    },
  });

  if (dmCount > 0) console.log(`[cleanup] ${dmCount} messages privés expirés supprimés`);
}

async function deleteExpiredReportedMessages() {
  const { count } = await prisma.reportedMessage.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
      status: { not: "pending" },
    },
  });
  if (count > 0) console.log(`[cleanup] ${count} signalements DM expirés supprimés`);
}

async function deleteExpiredAuditLogs() {
  const { count } = await prisma.adminAuditLog.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (count > 0) console.log(`[cleanup] ${count} audit logs expirés supprimés`);
}

async function deleteExpiredGuests() {
  const { count } = await prisma.user.deleteMany({
    where: { isGuest: true, guestExpiresAt: { lt: new Date() } },
  });
  if (count > 0) console.log(`[cleanup] ${count} comptes invités expirés supprimés`);
}

export async function runCleanup() {
  await Promise.allSettled([
    deleteExpiredDms(),
    deleteExpiredReportedMessages(),
    deleteExpiredAuditLogs(),
    deleteExpiredSecurityLogs(),
    deleteExpiredGuests(),
  ]);
}

// Run daily at ~3 AM relative to server start
export function scheduleCleanup() {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const now = new Date();
  const next3am = new Date(now);
  next3am.setHours(3, 0, 0, 0);
  if (next3am <= now) next3am.setDate(next3am.getDate() + 1);
  const msUntilFirst = next3am.getTime() - now.getTime();

  setTimeout(() => {
    runCleanup().catch(console.error);
    setInterval(() => runCleanup().catch(console.error), MS_PER_DAY);
  }, msUntilFirst);

  console.log(`[cleanup] planifié dans ${Math.round(msUntilFirst / 60000)} min`);
}
