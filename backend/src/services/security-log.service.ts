import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

export type SecurityEvent =
  | "register_success"
  | "register_failed_age"
  | "register_failed_captcha"
  | "register_failed_duplicate_ip"
  | "register_failed_email_exists"
  | "login_success"
  | "login_failed"
  | "login_suspended"
  | "login_banned"
  | "email_verify_success"
  | "email_verify_failed"
  | "parental_consent_approved"
  | "parental_consent_denied"
  | "account_suspended"
  | "account_unsuspended"
  | "dm_blocked_new_account"
  | "link_blocked_new_account"
  | "spam_detected";

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + "quizztest-ip-salt").digest("hex").slice(0, 32);
}

function retentionDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + env.SECURITY_LOG_RETENTION_DAYS);
  return d;
}

export async function logSecurity(opts: {
  event: SecurityEvent;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.securityLog.create({
    data: {
      event:     opts.event,
      userId:    opts.userId,
      ipHash:    opts.ip ? hashIp(opts.ip) : undefined,
      userAgent: opts.userAgent ? opts.userAgent.slice(0, 512) : undefined,
      metadata:  (opts.metadata ?? {}) as object,
      expiresAt: retentionDate(),
    },
  });
}

export async function countRecentRegistrationsByIp(
  ip: string,
  withinMinutes = 60,
): Promise<number> {
  const since = new Date(Date.now() - withinMinutes * 60 * 1000);
  return prisma.securityLog.count({
    where: {
      ipHash:    hashIp(ip),
      event:     "register_success",
      createdAt: { gte: since },
    },
  });
}

export async function deleteExpiredSecurityLogs(): Promise<void> {
  const { count } = await prisma.securityLog.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  if (count > 0) console.log(`[cleanup] ${count} security logs expirés supprimés`);
}
