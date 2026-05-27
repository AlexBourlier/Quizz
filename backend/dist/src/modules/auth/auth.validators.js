import { z } from "zod";
export const registerSchema = z.object({
    username: z.string().min(3).max(32),
    email: z.string().email().max(190),
    password: z.string().min(8).max(72),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
    captchaToken: z.string().optional(),
    parentEmail: z.string().email().optional(), // for parental consent flow
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    captchaToken: z.string().optional(),
});
export const refreshSchema = z.object({
    refreshToken: z.string().min(10)
});
