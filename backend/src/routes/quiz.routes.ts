import { Router } from "express";
import { createQuestionController, leaderboardController } from "../controllers/quiz.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const quizRouter = Router();

quizRouter.use(authMiddleware);
quizRouter.get("/leaderboard", leaderboardController);
quizRouter.post("/questions", requireRole(["admin", "moderator"]), createQuestionController);

export default quizRouter;
