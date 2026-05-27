import { prisma } from "../config/prisma.js";

export async function sendContactRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId) throw new Error("Impossible de s'ajouter soi-même");

  const blocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: receiverId, blockedId: senderId },
        { blockerId: senderId, blockedId: receiverId },
      ],
    },
  });
  if (blocked) throw new Error("Impossible d'envoyer une demande à cet utilisateur");

  const existing = await prisma.contactRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId } },
  });

  if (existing) {
    if (existing.status === "pending") throw new Error("Demande déjà envoyée");
    if (existing.status === "accepted") throw new Error("Vous êtes déjà contacts");
    // rejected → reset to pending so they can retry
    return prisma.contactRequest.update({
      where: { id: existing.id },
      data: { status: "pending" },
      include: { sender: { select: { id: true, username: true, color: true } } },
    });
  }

  return prisma.contactRequest.create({
    data: { senderId, receiverId },
    include: { sender: { select: { id: true, username: true, color: true } } },
  });
}

export async function acceptContactRequest(requestId: string, receiverId: string) {
  const req = await prisma.contactRequest.findFirst({
    where: { id: requestId, receiverId, status: "pending" },
  });
  if (!req) throw new Error("Demande introuvable");

  return prisma.contactRequest.update({
    where: { id: requestId },
    data: { status: "accepted" },
    include: { sender: { select: { id: true, username: true, color: true } } },
  });
}

export async function rejectContactRequest(requestId: string, receiverId: string) {
  const req = await prisma.contactRequest.findFirst({
    where: { id: requestId, receiverId, status: "pending" },
  });
  if (!req) throw new Error("Demande introuvable");

  await prisma.contactRequest.update({
    where: { id: requestId },
    data: { status: "rejected" },
  });
  return req.senderId;
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error("Impossible de se bloquer soi-même");

  // Remove any contact relations between the two users
  await prisma.contactRequest.deleteMany({
    where: {
      OR: [
        { senderId: blockerId, receiverId: blockedId },
        { senderId: blockedId, receiverId: blockerId },
      ],
    },
  });

  return prisma.blockedUser.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: {},
    create: { blockerId, blockedId },
    include: { blocked: { select: { id: true, username: true } } },
  });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
}

export async function getPendingRequests(receiverId: string) {
  return prisma.contactRequest.findMany({
    where: { receiverId, status: "pending" },
    include: { sender: { select: { id: true, username: true, color: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBlockedUsers(blockerId: string) {
  return prisma.blockedUser.findMany({
    where: { blockerId },
    include: { blocked: { select: { id: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getContacts(userId: string) {
  const requests = await prisma.contactRequest.findMany({
    where: {
      status: "accepted",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender:   { select: { id: true, username: true, color: true } },
      receiver: { select: { id: true, username: true, color: true } },
    },
  });
  return requests.map((r) => (r.senderId === userId ? r.receiver : r.sender));
}

export async function getSentPendingIds(senderId: string) {
  const requests = await prisma.contactRequest.findMany({
    where: { senderId, status: "pending" },
    select: { receiverId: true },
  });
  return requests.map((r) => r.receiverId);
}

export async function areContacts(userAId: string, userBId: string): Promise<boolean> {
  const req = await prisma.contactRequest.findFirst({
    where: {
      status: "accepted",
      OR: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    },
  });
  return !!req;
}

export async function isBlockedBy(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await prisma.blockedUser.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  return !!block;
}
