import { prisma } from "../config/prisma.js";
export async function listVisibleRooms(userId, role) {
    const rooms = await prisma.room.findMany({
        include: {
            requiredRole: true,
            members: {
                where: { userId },
                select: { id: true }
            }
        },
        orderBy: { createdAt: "asc" }
    });
    return rooms.filter((room) => {
        if (role === "admin" || role === "moderator")
            return true;
        if (room.type === "public")
            return true;
        if (room.type === "private")
            return room.members.length > 0;
        if (room.type === "restricted" && room.requiredRole) {
            return room.requiredRole.name === role;
        }
        return false;
    });
}
export async function createRoom(data) {
    const requiredRole = data.requiredRole
        ? await prisma.role.findUnique({ where: { name: data.requiredRole } })
        : null;
    return prisma.room.create({
        data: {
            name: data.name,
            type: data.type,
            requiredRoleId: requiredRole?.id,
            rules: data.rules,
            ageLimit: data.ageLimit,
            maxOccupants: data.maxOccupants
        },
        include: { requiredRole: true }
    });
}
export async function joinRoom(roomId, userId) {
    await prisma.roomMember.upsert({
        where: { roomId_userId: { roomId, userId } },
        update: {},
        create: { roomId, userId }
    });
}
export async function leaveRoom(roomId, userId) {
    await prisma.roomMember.deleteMany({ where: { roomId, userId } });
}
export async function canAccessRoom(roomId, userId, role) {
    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
            members: { where: { userId }, select: { id: true } },
            requiredRole: true
        }
    });
    if (!room)
        return false;
    if (role === "admin" || role === "moderator")
        return true;
    if (room.type === "public")
        return true;
    if (room.type === "private")
        return room.members.length > 0;
    if (room.type === "restricted" && room.requiredRole) {
        return room.requiredRole.name === role;
    }
    return false;
}
