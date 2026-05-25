import { z } from "zod";

export const sendMessageSchema = z.object({
  roomId: z.string().cuid(),
  content: z.string().min(1).max(2000)
});

export const updateMessageSchema = z.object({
  messageId: z.string().cuid(),
  content: z.string().min(1).max(2000)
});

export const reactionSchema = z.object({
  messageId: z.string().cuid(),
  emoji: z.string().min(1).max(8)
});
