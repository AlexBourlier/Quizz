import { z } from "zod";
export const createQuestionSchema = z.object({
    question: z.string().min(5),
    answer: z.string().min(1),
    category: z.string().min(2).max(64),
    difficulty: z.enum(["easy", "medium", "hard"])
});
export const startQuizSchema = z.object({
    roomId: z.string().cuid(),
    category: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional()
});
