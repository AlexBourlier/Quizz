import { RoleName } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { signAccessToken, signRefreshToken, type JwtUserPayload } from "../utils/jwt.js";

export async function banUser(username: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error(`Utilisateur "${username}" introuvable`);
  if (user.email === "quizbot@quizztest.local") throw new Error("Impossible de bannir le bot");

  await prisma.user.update({
    where: { id: user.id },
    data: { bannedAt: new Date(), refreshTokenHash: null }
  });
  return user;
}

export async function unbanUser(username: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error(`Utilisateur "${username}" introuvable`);

  await prisma.user.update({ where: { id: user.id }, data: { bannedAt: null } });
  return user;
}

export async function muteUser(username: string, minutes: number) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new Error(`Utilisateur "${username}" introuvable`);

  const mutedUntil = new Date(Date.now() + minutes * 60_000);
  await prisma.user.update({ where: { id: user.id }, data: { mutedUntil } });
  return { user, mutedUntil };
}

export async function promoteToMod(username: string) {
  const user = await prisma.user.findUnique({ where: { username }, include: { role: true } });
  if (!user) throw new Error(`Utilisateur "${username}" introuvable`);
  if (user.role.name === RoleName.admin) throw new Error("Impossible de rétrograder un admin");

  const modRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.moderator } });
  await prisma.user.update({ where: { id: user.id }, data: { roleId: modRole.id } });

  const payload: JwtUserPayload = { sub: user.id, username: user.username, role: "moderator" };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: await bcrypt.hash(refreshToken, 12) }
  });

  return { user, accessToken, refreshToken };
}

export async function updateUserColor(userId: string, color: string) {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Couleur invalide (format #rrggbb)");
  return prisma.user.update({ where: { id: userId }, data: { color } });
}

export async function checkBanned(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { bannedAt: true } });
  return user?.bannedAt !== null && user?.bannedAt !== undefined;
}

export async function checkMuted(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { mutedUntil: true } });
  if (!user?.mutedUntil) return false;
  return user.mutedUntil > new Date();
}
