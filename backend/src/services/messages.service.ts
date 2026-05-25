import { prisma } from "../config/prisma.js";

const USER_SELECT = {
  id: true,
  username: true,
  avatar: true,
  color: true,
  role: { select: { name: true } },
} as const;

function flattenUser<T extends { user: { role: { name: string } } }>(msg: T) {
  const { role, ...rest } = msg.user;
  return { ...msg, user: { ...rest, role: role.name } };
}

export async function getRoomMessages(roomId: string) {
  const messages = await prisma.message.findMany({
    where: { roomId, deletedAt: null },
    include: { user: { select: USER_SELECT }, reactions: true },
    orderBy: { createdAt: "asc" },
    take: 100
  });
  return messages.map(flattenUser);
}

export async function createMessage(data: { roomId: string; userId: string; content: string }) {
  const message = await prisma.message.create({
    data,
    include: { user: { select: USER_SELECT }, reactions: true }
  });
  return flattenUser(message);
}

export async function editMessage(messageId: string, userId: string, content: string, canModerate: boolean) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message || message.deletedAt) {
    throw new Error("Message not found");
  }

  if (message.userId !== userId && !canModerate) {
    throw new Error("Forbidden");
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content, editedAt: new Date() },
    include: { user: { select: USER_SELECT }, reactions: true }
  });
  return flattenUser(updated);
}

export async function deleteMessage(messageId: string, userId: string, canModerate: boolean) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message || message.deletedAt) {
    throw new Error("Message not found");
  }

  if (message.userId !== userId && !canModerate) {
    throw new Error("Forbidden");
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() }
  });
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  await prisma.messageReaction.upsert({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId,
        emoji
      }
    },
    update: {},
    create: { messageId, userId, emoji }
  });

  return prisma.messageReaction.findMany({ where: { messageId } });
}
