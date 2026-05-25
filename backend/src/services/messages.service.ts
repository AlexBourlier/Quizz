import { prisma } from "../config/prisma.js";

export async function getRoomMessages(roomId: string) {
  return prisma.message.findMany({
    where: { roomId, deletedAt: null },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      reactions: true
    },
    orderBy: { createdAt: "asc" },
    take: 100
  });
}

export async function createMessage(data: { roomId: string; userId: string; content: string }) {
  return prisma.message.create({
    data,
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      reactions: true
    }
  });
}

export async function editMessage(messageId: string, userId: string, content: string, canModerate: boolean) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message || message.deletedAt) {
    throw new Error("Message not found");
  }

  if (message.userId !== userId && !canModerate) {
    throw new Error("Forbidden");
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { content, editedAt: new Date() },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      reactions: true
    }
  });
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
