import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email().max(190),
  password: z.string().min(8).max(72)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
