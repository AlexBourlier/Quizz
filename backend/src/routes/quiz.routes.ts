import { Router } from "express";
import type { Request, Response } from "express";
import { createQuestionController, leaderboardController } from "../controllers/quiz.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { getCategories, resetLeaderboard } from "../services/quiz.service.js";

const quizRouter = Router();
quizRouter.use(authMiddleware);

quizRouter.get("/leaderboard", leaderboardController);
quizRouter.get("/categories", async (_req: Request, res: Response) => {
  const categories = await getCategories();
  return res.json(categories);
});
quizRouter.post("/questions", requireRole(["admin", "moderator"]), createQuestionController);
quizRouter.post("/leaderboard/reset", requireRole(["admin"]), async (_req: Request, res: Response) => {
  await resetLeaderboard();
  return res.json({ ok: true });
});

export default quizRouter;
