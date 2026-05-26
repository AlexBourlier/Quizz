import { prisma } from "../config/prisma.js";

const PROTECTED_ROOMS = ["general", "quiz-arena"];

export async function listVisibleRooms(userId: string, role: string) {
  const rooms = await prisma.room.findMany({
    include: {
      requiredRole: true,
      members: { where: { userId }, select: { id: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  type R = (typeof rooms)[number];
  return rooms.filter((room: R) => {
    if (role === "admin" || role === "moderator") return true;
    if (room.type === "public") return true;
    if (room.type === "private") return room.members.length > 0;
    if (room.type === "restricted" && room.requiredRole) {
      return room.requiredRole.name === role;
    }
    return false;
  });
}

export async function createRoom(data: {
  name: string;
  type: "public" | "private" | "restricted";
  requiredRole?: "admin" | "moderator" | "user";
  rules?: string;
  ageLimit?: number;
  maxOccupants?: number;
}) {
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

export async function editRoom(
  roomId: string,
  data: {
    name?: string;
    type?: "public" | "private" | "restricted";
    rules?: string | null;
    ageLimit?: number | null;
    maxOccupants?: number | null;
  }
) {
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });
  if (room.name === "quiz-arena") {
    throw new Error("Le salon quiz-arena ne peut pas être modifié");
  }
  return prisma.room.update({
    where: { id: roomId },
    data,
    include: { requiredRole: true }
  });
}

export async function deleteRoom(roomId: string) {
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });
  if (PROTECTED_ROOMS.includes(room.name)) {
    throw new Error(`Le salon "${room.name}" ne peut pas être supprimé`);
  }
  return prisma.room.delete({ where: { id: roomId } });
}

export async function inviteUserToRoom(roomId: string, userId: string, invitedById: string) {
  await prisma.roomInvitation.upsert({
    where: { roomId_invitedId: { roomId, invitedId: userId } },
    update: {},
    create: { roomId, invitedId: userId, invitedById }
  });
  await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId, userId } },
    update: {},
    create: { roomId, userId }
  });
  return prisma.room.findUniqueOrThrow({ where: { id: roomId } });
}

export async function getRoomModerators(roomId: string) {
  return prisma.roomModerator.findMany({
    where: { roomId },
    include: { user: { select: { id: true, username: true, avatar: true } } }
  });
}

export async function addRoomModerator(roomId: string, userId: string) {
  return prisma.roomModerator.upsert({
    where: { roomId_userId: { roomId, userId } },
    update: {},
    create: { roomId, userId }
  });
}

export async function removeRoomModerator(roomId: string, userId: string) {
  return prisma.roomModerator.deleteMany({ where: { roomId, userId } });
}

export async function isRoomModerator(roomId: string, userId: string): Promise<boolean> {
  const mod = await prisma.roomModerator.findUnique({
    where: { roomId_userId: { roomId, userId } }
  });
  return !!mod;
}

export async function joinRoom(roomId: string, userId: string) {
  await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId, userId } },
    update: {},
    create: { roomId, userId }
  });
}

export async function leaveRoom(roomId: string, userId: string) {
  await prisma.roomMember.deleteMany({ where: { roomId, userId } });
}

export async function canAccessRoom(roomId: string, userId: string, role: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      members: { where: { userId }, select: { id: true } },
      requiredRole: true
    }
  });

  if (!room) return false;
  if (role === "admin" || role === "moderator") return true;
  if (room.type === "public") return true;
  if (room.type === "private") return room.members.length > 0;
  if (room.type === "restricted" && room.requiredRole) {
    return room.requiredRole.name === role;
  }
  return false;
}
