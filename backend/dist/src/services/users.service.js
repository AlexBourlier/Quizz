import { prisma } from "../config/prisma.js";
export async function updateProfile(userId, data) {
    return prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, username: true, email: true, avatar: true, color: true }
    });
}
export async function setPendingAvatar(userId, base64) {
    return prisma.user.update({
        where: { id: userId },
        data: { pendingAvatar: base64 },
        select: { id: true, pendingAvatar: true }
    });
}
export async function getPendingAvatars() {
    return prisma.user.findMany({
        where: { pendingAvatar: { not: null } },
        select: { id: true, username: true, pendingAvatar: true, avatar: true }
    });
}
export async function approveAvatar(userId) {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { pendingAvatar: true }
    });
    if (!user.pendingAvatar)
        throw new Error("Aucun avatar en attente");
    return prisma.user.update({
        where: { id: userId },
        data: { avatar: user.pendingAvatar, pendingAvatar: null },
        select: { id: true, username: true, avatar: true }
    });
}
export async function rejectAvatar(userId) {
    return prisma.user.update({
        where: { id: userId },
        data: { pendingAvatar: null },
        select: { id: true }
    });
}
export async function deleteAccount(userId) {
    return prisma.user.delete({ where: { id: userId } });
}
