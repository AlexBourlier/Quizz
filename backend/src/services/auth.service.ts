import { RoleName } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import type { LoginInput, RegisterInput } from "../modules/auth/auth.validators.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type JwtUserPayload
} from "../utils/jwt.js";
import { env } from "../config/env.js";
import { sendVerificationEmail, sendParentalConsentEmail } from "./email.service.js";
import { verifyCaptcha } from "./captcha.service.js";
import {
  logSecurity,
  countRecentRegistrationsByIp,
} from "./security-log.service.js";

function toPayload(user: { id: string; username: string; role: { name: RoleName } }): JwtUserPayload {
  return {
    sub: user.id,
    username: user.username,
    role: user.role.name
  };
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function tokenExpiresAt(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function register(
  data: RegisterInput,
  meta: { ip?: string; userAgent?: string } = {},
) {
  // Captcha
  const captchaOk = await verifyCaptcha(data.captchaToken);
  if (!captchaOk) {
    await logSecurity({ event: "register_failed_captcha", ip: meta.ip, userAgent: meta.userAgent });
    throw new Error("Vérification captcha échouée");
  }

  // Age check
  const birthDate = new Date(data.birthDate);
  if (isNaN(birthDate.getTime())) throw new Error("Date de naissance invalide");

  const age = calculateAge(birthDate);
  if (age < env.MIN_AGE_YEARS) {
    await logSecurity({ event: "register_failed_age", ip: meta.ip, userAgent: meta.userAgent, metadata: { age } });
    throw new Error(`Vous devez avoir au moins ${env.MIN_AGE_YEARS} ans pour vous inscrire`);
  }

  // Multi-account detection: >2 registrations from same IP in last hour
  if (meta.ip) {
    const recentCount = await countRecentRegistrationsByIp(meta.ip);
    if (recentCount >= 2) {
      await logSecurity({ event: "register_failed_duplicate_ip", ip: meta.ip, userAgent: meta.userAgent });
      throw new Error("Trop de comptes créés depuis cette adresse. Réessayez plus tard.");
    }
  }

  // Unique email
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    await logSecurity({ event: "register_failed_email_exists", ip: meta.ip, userAgent: meta.userAgent });
    throw new Error("Email already used");
  }

  const role        = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.user } });
  const hashedPassword = await bcrypt.hash(data.password, 12);
  const verifyToken    = generateToken();

  // Parental consent required if age < PARENTAL_CONSENT_MIN_AGE
  const needsParentalConsent = age < env.PARENTAL_CONSENT_MIN_AGE;
  const parentalToken = needsParentalConsent ? generateToken() : null;

  const user = await prisma.user.create({
    data: {
      username:                 data.username,
      email:                    data.email,
      password:                 hashedPassword,
      roleId:                   role.id,
      birthDate,
      registrationIp:           meta.ip,
      emailVerifyToken:         verifyToken,
      emailVerifyTokenExpiresAt: tokenExpiresAt(24),
      // If parental consent needed, account is suspended until parent approves
      isSuspended:              needsParentalConsent,
      parentalConsentToken:     parentalToken,
    },
    include: { role: true }
  });

  // Send emails async — don't fail registration if email fails
  sendVerificationEmail(data.email, verifyToken).catch(console.error);

  if (needsParentalConsent && data.parentEmail && parentalToken) {
    sendParentalConsentEmail(data.parentEmail, data.username, parentalToken).catch(console.error);
  }

  await logSecurity({
    event:    "register_success",
    userId:   user.id,
    ip:       meta.ip,
    userAgent: meta.userAgent,
    metadata: { age, needsParentalConsent },
  });

  // Don't issue tokens for suspended accounts (parental consent pending)
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  if (!needsParentalConsent) {
    const payload = toPayload(user);
    accessToken  = signAccessToken(payload);
    refreshToken = signRefreshToken(payload);
    await prisma.user.update({
      where: { id: user.id },
      data:  { refreshTokenHash: await bcrypt.hash(refreshToken, 12) }
    });
  }

  return {
    user: {
      id:              user.id,
      username:        user.username,
      email:           user.email,
      role:            user.role.name,
      termsAcceptedAt: null as string | null,
      emailVerifiedAt: null as string | null,
      isSuspended:     user.isSuspended,
    },
    accessToken,
    refreshToken,
    needsEmailVerification: true,
    needsParentalConsent,
  };
}

export async function login(
  data: LoginInput,
  meta: { ip?: string; userAgent?: string } = {},
) {
  const captchaOk = await verifyCaptcha(data.captchaToken);
  if (!captchaOk) {
    throw new Error("Vérification captcha échouée");
  }

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { role: true }
  });

  if (!user) {
    await logSecurity({ event: "login_failed", ip: meta.ip, userAgent: meta.userAgent });
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    await logSecurity({ event: "login_failed", userId: user.id, ip: meta.ip, userAgent: meta.userAgent });
    throw new Error("Invalid credentials");
  }

  if (user.bannedAt) {
    await logSecurity({ event: "login_banned", userId: user.id, ip: meta.ip });
    throw new Error("Ce compte a été banni");
  }

  if (user.isSuspended) {
    const suspendedMsg = user.suspendedUntil
      ? `Ce compte est suspendu jusqu'au ${user.suspendedUntil.toLocaleDateString("fr-FR")}`
      : "Ce compte est suspendu";
    await logSecurity({ event: "login_suspended", userId: user.id, ip: meta.ip });
    throw new Error(suspendedMsg);
  }

  await logSecurity({ event: "login_success", userId: user.id, ip: meta.ip, userAgent: meta.userAgent });

  const payload      = toPayload(user);
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data:  { refreshTokenHash: await bcrypt.hash(refreshToken, 12) }
  });

  return {
    user: {
      id:              user.id,
      username:        user.username,
      email:           user.email,
      role:            user.role.name,
      termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      isSuspended:     user.isSuspended,
    },
    accessToken,
    refreshToken
  };
}

export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: true }
  });

  if (!user || !user.refreshTokenHash) {
    throw new Error("Invalid refresh token");
  }

  const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!valid) {
    throw new Error("Invalid refresh token");
  }

  const nextPayload    = toPayload(user);
  const accessToken    = signAccessToken(nextPayload);
  const nextRefreshToken = signRefreshToken(nextPayload);

  await prisma.user.update({
    where: { id: user.id },
    data:  { refreshTokenHash: await bcrypt.hash(nextRefreshToken, 12) }
  });

  return {
    accessToken,
    refreshToken:    nextRefreshToken,
    termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    isSuspended:     user.isSuspended,
  };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data:  { refreshTokenHash: null }
  });
}

export async function verifyEmail(token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken:         token,
      emailVerifyTokenExpiresAt: { gt: new Date() },
    },
  });
  if (!user) throw new Error("Lien de vérification invalide ou expiré");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt:           new Date(),
      emailVerifyToken:          null,
      emailVerifyTokenExpiresAt: null,
    },
  });

  await logSecurity({ event: "email_verify_success", userId: user.id });
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  if (user.emailVerifiedAt) throw new Error("Email déjà vérifié");

  const token = generateToken();
  await prisma.user.update({
    where: { id: userId },
    data:  { emailVerifyToken: token, emailVerifyTokenExpiresAt: tokenExpiresAt(24) },
  });
  await sendVerificationEmail(user.email, token);
}

export async function loginAsGuest() {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.user } });

  // Find a unique Invité### username
  let username = "";
  for (let attempt = 0; attempt < 15; attempt++) {
    const digits = String(Math.floor(Math.random() * 900) + 100);
    const candidate = `Invité${digits}`;
    const exists = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!exists) { username = candidate; break; }
  }
  if (!username) username = `Invité${Date.now() % 100000}`;

  const uid = crypto.randomBytes(8).toString("hex");
  const fakeEmail    = `guest_${uid}@guest.local`;
  const fakePassword = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(fakePassword, 8);
  const guestExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      username,
      email: fakeEmail,
      password: hashedPassword,
      roleId: role.id,
      isGuest: true,
      guestExpiresAt,
      termsAcceptedAt: new Date(),
    },
    include: { role: true },
  });

  const payload: JwtUserPayload = {
    sub:      user.id,
    username: user.username,
    role:     user.role.name,
    isGuest:  true,
  };

  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data:  { refreshTokenHash: await bcrypt.hash(refreshToken, 8) },
  });

  return {
    user: {
      id:              user.id,
      username:        user.username,
      role:            user.role.name,
      isGuest:         true,
      termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
      emailVerifiedAt: null as string | null,
    },
    accessToken,
    refreshToken,
  };
}

export async function handleParentalConsent(token: string, action: "approve" | "deny"): Promise<void> {
  const user = await prisma.user.findFirst({ where: { parentalConsentToken: token } });
  if (!user) throw new Error("Lien de consentement invalide ou déjà utilisé");

  if (action === "approve") {
    await prisma.user.update({
      where: { id: user.id },
      data:  { parentalConsentAt: new Date(), parentalConsentToken: null, isSuspended: false },
    });
    await logSecurity({ event: "parental_consent_approved", userId: user.id });
  } else {
    // Deny: delete the account
    await prisma.user.delete({ where: { id: user.id } });
    await logSecurity({ event: "parental_consent_denied" });
  }
}
