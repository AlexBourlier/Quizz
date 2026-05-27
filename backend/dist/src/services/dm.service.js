import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { encrypt, decrypt } from "./encryption.service.js";
import { areContacts, isBlockedBy } from "./contacts.service.js";
function dmExpiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + env.DM_RETENTION_DAYS);
    return d;
}
function reportedMsgExpiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + env.REPORTED_MSG_RETENTION_DAYS);
    return d;
}
// ── Send ─────────────────────────────────────────────────────────────────────
export async function sendDm(senderId, recipientUsername, plainContent) {
    const recipient = await prisma.user.findUnique({
        where: { username: recipientUsername },
        select: { id: true, username: true },
    });
    if (!recipient)
        throw new Error(`Utilisateur "${recipientUsername}" introuvable`);
    if (recipient.id === senderId)
        throw new Error("Impossible de s'envoyer un message à soi-même");
    if (await isBlockedBy(recipient.id, senderId))
        throw new Error("Vous ne pouvez pas contacter cet utilisateur");
    if (await isBlockedBy(senderId, recipient.id))
        throw new Error("Vous avez bloqué cet utilisateur");
    if (!(await areContacts(senderId, recipient.id)))
        throw new Error("Vous devez être contacts pour envoyer un message privé");
    const { content, iv, authTag, keyVersion } = encrypt(plainContent);
    const dm = await prisma.privateMessage.create({
        data: {
            senderId,
            recipientId: recipient.id,
            content,
            iv,
            authTag,
            keyVersion,
            expiresAt: dmExpiresAt(),
        },
        include: { sender: { select: { id: true, username: true, color: true } } },
    });
    return { dm, recipientId: recipient.id, plainContent };
}
// ── History ───────────────────────────────────────────────────────────────────
export async function getDmHistory(userAId, userBId, limit = 50) {
    const messages = await prisma.privateMessage.findMany({
        where: {
            OR: [
                { senderId: userAId, recipientId: userBId },
                { senderId: userBId, recipientId: userAId },
            ],
            // Exclude hard-expired messages (edge case: expiresAt null = legacy, still show)
        },
        include: { sender: { select: { id: true, username: true, color: true } } },
        orderBy: { createdAt: "asc" },
        take: limit,
    });
    return messages.map((m) => ({
        id: m.id,
        content: decrypt({ content: m.content, iv: m.iv, authTag: m.authTag, keyVersion: m.keyVersion }),
        createdAt: m.createdAt,
        sender: m.sender,
    }));
}
// ── Contacts ──────────────────────────────────────────────────────────────────
export async function getDmContacts(userId) {
    const requests = await prisma.contactRequest.findMany({
        where: {
            status: "accepted",
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        include: {
            sender: { select: { id: true, username: true, color: true } },
            receiver: { select: { id: true, username: true, color: true } },
        },
    });
    return requests.map((r) => r.senderId === userId ? r.receiver : r.sender);
}
// ── Mark read ─────────────────────────────────────────────────────────────────
export async function markDmsRead(recipientId, senderId) {
    await prisma.privateMessage.updateMany({
        where: { recipientId, senderId, readAt: null },
        data: { readAt: new Date() },
    });
}
// ── Delete conversation ───────────────────────────────────────────────────────
export async function deleteConversation(userAId, userBId) {
    await prisma.privateMessage.deleteMany({
        where: {
            OR: [
                { senderId: userAId, recipientId: userBId },
                { senderId: userBId, recipientId: userAId },
            ],
        },
    });
    await prisma.contactRequest.deleteMany({
        where: {
            OR: [
                { senderId: userAId, receiverId: userBId },
                { senderId: userBId, receiverId: userAId },
            ],
        },
    });
}
// ── Report DM ─────────────────────────────────────────────────────────────────
export async function reportDm(opts) {
    const msg = await prisma.privateMessage.findUnique({
        where: { id: opts.messageId },
        select: {
            id: true, senderId: true, recipientId: true,
            content: true, iv: true, authTag: true, keyVersion: true,
        },
    });
    if (!msg)
        throw new Error("Message introuvable");
    // Only parties can report
    if (msg.senderId !== opts.reporterId && msg.recipientId !== opts.reporterId) {
        throw new Error("Vous ne faites pas partie de cette conversation");
    }
    // Copy encrypted payload (never decrypt at this stage)
    return prisma.reportedMessage.create({
        data: {
            originalMessageId: msg.id,
            encryptedContent: msg.content,
            iv: msg.iv,
            authTag: msg.authTag,
            keyVersion: msg.keyVersion,
            senderId: msg.senderId,
            recipientId: msg.recipientId,
            reporterId: opts.reporterId,
            reason: opts.reason,
            expiresAt: reportedMsgExpiresAt(),
        },
    });
}
