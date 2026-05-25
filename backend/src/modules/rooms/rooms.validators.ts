import { RoomType } from "@prisma/client";
import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(2).max(64),
  type: z.nativeEnum(RoomType),
  requiredRole: z.enum(["admin", "moderator", "user"]).optional()
});
