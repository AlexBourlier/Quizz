import { RoomType } from "@prisma/client";
import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(2).max(64),
  type: z.nativeEnum(RoomType),
  requiredRole: z.enum(["admin", "moderator", "user"]).optional(),
  rules: z.string().max(1000).optional(),
  ageLimit: z.number().int().min(0).max(99).optional(),
  maxOccupants: z.number().int().min(2).max(10000).optional()
});
