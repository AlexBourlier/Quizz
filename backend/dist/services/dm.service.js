import { prisma } from "../config/prisma.js";
import { decryptText, encryptText } from "../utils/crypto.js";
export async function sendDm(senderId, recipientUsername, plainContent) {
    const recipient = await prisma.user.findUnique({
        where: { username: recipientUsername },
        select: { id: true, username: true }
    });
    if (!recipient)
        throw new Error(`Utilisateur "${recipientUsername}" introuvable`);
    if (recipient.id === senderId)
        throw new Error("Impossible de s'envoyer un message à soi-même");
    const { cipher, iv } = encryptText(plainContent);
    const dm = await prisma.privateMessage.create({
        data: { senderId, recipientId: recipient.id, content: cipher, iv },
        include: {
            sender: { select: { id: true, username: true, color: true } }
        }
    });
    return { dm, recipientId: recipient.id, plainContent };
}
export async function getDmHistory(userAId, userBId, limit = 50) {
    const messages = await prisma.privateMessage.findMany({
        where: {
            OR: [
                { senderId: userAId, recipientId: userBId },
                { senderId: userBId, recipientId: userAId }
            ]
        },
        include: {
            sender: { select: { id: true, username: true, color: true } }
        },
        orderBy: { createdAt: "asc" },
        take: limit
    });
    return messages.map((m) => ({
        id: m.id,
        content: decryptText(m.content, m.iv),
        createdAt: m.createdAt,
        sender: m.sender
    }));
}
export async function getDmContacts(userId) {
    const messages = await prisma.privateMessage.findMany({
        where: { OR: [{ senderId: userId }, { recipientId: userId }] },
        select: {
            senderId: true,
            recipientId: true,
            sender: { select: { id: true, username: true, color: true } },
            recipient: { select: { id: true, username: true, color: true } },
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
    const seen = new Set();
    const contacts = [];
    for (const msg of messages) {
        const other = msg.senderId === userId ? msg.recipient : msg.sender;
        if (!seen.has(other.id)) {
            seen.add(other.id);
            contacts.push(other);
        }
    }
    return contacts;
}
export async function markDmsRead(recipientId, senderId) {
    await prisma.privateMessage.updateMany({
        where: { recipientId, senderId, readAt: null },
        data: { readAt: new Date() }
    });
}
