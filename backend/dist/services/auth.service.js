import { RoleName } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
function toPayload(user) {
    return {
        sub: user.id,
        username: user.username,
        role: user.role.name
    };
}
export async function register(data) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
        throw new Error("Email already used");
    }
    const role = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.user } });
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
        data: {
            username: data.username,
            email: data.email,
            password: hashedPassword,
            roleId: role.id
        },
        include: { role: true }
    });
    const payload = toPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: await bcrypt.hash(refreshToken, 12) }
    });
    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name
        },
        accessToken,
        refreshToken
    };
}
export async function login(data) {
    const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { role: true }
    });
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
        throw new Error("Invalid credentials");
    }
    if (user.bannedAt) {
        throw new Error("Ce compte a été banni");
    }
    const payload = toPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: await bcrypt.hash(refreshToken, 12) }
    });
    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name
        },
        accessToken,
        refreshToken
    };
}
export async function refresh(refreshToken) {
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
    const nextPayload = toPayload(user);
    const accessToken = signAccessToken(nextPayload);
    const nextRefreshToken = signRefreshToken(nextPayload);
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: await bcrypt.hash(nextRefreshToken, 12) }
    });
    return { accessToken, refreshToken: nextRefreshToken };
}
export async function logout(userId) {
    await prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null }
    });
}
