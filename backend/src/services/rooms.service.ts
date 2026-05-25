import { RoleName, RoomType } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export async function listVisibleRooms(userId: string, role: RoleName) {
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
    if (role === RoleName.admin || role === RoleName.moderator) {
      return true;
    }

    if (room.type === RoomType.public) {
      return true;
    }

    if (room.type === RoomType.private) {
      return room.members.length > 0;
    }

    if (room.type === RoomType.restricted && room.requiredRole) {
      return room.requiredRole.name === role || role === RoleName.admin;
    }

    return false;
  });
}

export async function createRoom(data: {
  name: string;
  type: RoomType;
  requiredRole?: "admin" | "moderator" | "user";
}) {
  const requiredRole = data.requiredRole
    ? await prisma.role.findUnique({ where: { name: data.requiredRole } })
    : null;

  return prisma.room.create({
    data: {
      name: data.name,
      type: data.type,
      requiredRoleId: requiredRole?.id
    },
    include: { requiredRole: true }
  });
}

export async function joinRoom(roomId: string, userId: string) {
  await prisma.roomMember.upsert({
    where: {
      roomId_userId: { roomId, userId }
    },
    update: {},
    create: { roomId, userId }
  });
}

export async function leaveRoom(roomId: string, userId: string) {
  await prisma.roomMember.deleteMany({ where: { roomId, userId } });
}

export async function canAccessRoom(roomId: string, userId: string, role: RoleName) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: { where: { userId }, select: { id: true } },
      requiredRole: true
    }
  });

  if (!room) {
    return false;
  }

  if (role === RoleName.admin || role === RoleName.moderator) {
    return true;
  }

  if (room.type === RoomType.public) {
    return true;
  }

  if (room.type === RoomType.private) {
    return room.members.length > 0;
  }

  if (room.type === RoomType.restricted && room.requiredRole) {
    return room.requiredRole.name === role;
  }

  return false;
}
