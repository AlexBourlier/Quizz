import type { Request, Response } from "express";
import {
  reactionSchema,
  sendMessageSchema,
  updateMessageSchema
} from "../modules/messages/messages.validators.js";
import {
  addReaction,
  createMessage,
  deleteMessage,
  editMessage,
  getRoomMessages
} from "../services/messages.service.js";

export async function getMessagesController(req: Request, res: Response) {
  const messages = await getRoomMessages(req.params.roomId);
  return res.json(messages);
}

export async function sendMessageController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const parsed = sendMessageSchema.parse(req.body);
    const message = await createMessage({
      roomId: parsed.roomId,
      userId: req.user.sub,
      content: parsed.content
    });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function updateMessageController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const parsed = updateMessageSchema.parse({
      messageId: req.params.messageId,
      content: req.body.content
    });

    const canModerate = req.user.role === "admin" || req.user.role === "moderator";
    const message = await editMessage(parsed.messageId, req.user.sub, parsed.content, canModerate);
    return res.json(message);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function deleteMessageController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const canModerate = req.user.role === "admin" || req.user.role === "moderator";
    await deleteMessage(req.params.messageId, req.user.sub, canModerate);
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function reactToMessageController(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const parsed = reactionSchema.parse({
      messageId: req.params.messageId,
      emoji: req.body.emoji
    });

    const reactions = await addReaction(parsed.messageId, req.user.sub, parsed.emoji);
    return res.json(reactions);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}
