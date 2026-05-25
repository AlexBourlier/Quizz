import type { Request, Response } from "express";
import { createQuestionSchema } from "../modules/quiz/quiz.validators.js";
import { createQuestion, getLeaderboard } from "../services/quiz.service.js";

export async function createQuestionController(req: Request, res: Response) {
  try {
    const parsed = createQuestionSchema.parse(req.body);
    const question = await createQuestion(parsed);
    return res.status(201).json(question);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
}

export async function leaderboardController(_req: Request, res: Response) {
  const leaderboard = await getLeaderboard();
  return res.json(leaderboard);
}
