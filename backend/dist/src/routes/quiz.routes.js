import { Router } from "express";
import { z } from "zod";
import { createQuestionController, leaderboardController } from "../controllers/quiz.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { getCategories, resetLeaderboard } from "../services/quiz.service.js";
import { getMySuggestions, getPendingSuggestions, reviewSuggestion, submitSuggestion, } from "../services/suggestions.service.js";
const quizRouter = Router();
// Public routes (no auth required)
quizRouter.get("/leaderboard", leaderboardController);
quizRouter.get("/categories", async (_req, res) => {
    const categories = await getCategories();
    return res.json(categories);
});
quizRouter.use(authMiddleware);
// Direct creation kept for moderators only (bypass suggestion workflow for trusted editors)
quizRouter.post("/questions", requireRole(["moderator"]), createQuestionController);
quizRouter.post("/leaderboard/reset", requireRole(["admin"]), async (_req, res) => {
    await resetLeaderboard();
    return res.json({ ok: true });
});
// ── Question suggestions ─────────────────────────────────────────────────────
const submitSchema = z.object({
    type: z.enum(["new_question", "correction"]),
    questionId: z.string().cuid().optional(),
    question: z.string().min(5).max(500),
    answer: z.string().min(1).max(255),
    category: z.string().min(2).max(64),
    difficulty: z.enum(["easy", "medium", "hard"]),
});
const reviewSchema = z.object({
    status: z.enum(["accepted", "rejected"]),
    adminComment: z.string().max(500).optional(),
});
quizRouter.post("/suggestions", requireRole(["user", "moderator"]), async (req, res) => {
    if (req.user.isGuest)
        return res.status(403).json({ message: "Non disponible pour les comptes invités" });
    try {
        const body = submitSchema.parse(req.body);
        const suggestion = await submitSuggestion({ ...body, submitterId: req.user.sub });
        return res.status(201).json(suggestion);
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
});
quizRouter.get("/suggestions/mine", requireRole(["user", "moderator"]), async (req, res) => {
    if (req.user.isGuest)
        return res.json([]);
    const suggestions = await getMySuggestions(req.user.sub);
    return res.json(suggestions);
});
quizRouter.get("/suggestions/pending", requireRole(["admin"]), async (_req, res) => {
    const suggestions = await getPendingSuggestions();
    return res.json(suggestions);
});
quizRouter.patch("/suggestions/:id/review", requireRole(["admin"]), async (req, res) => {
    try {
        const body = reviewSchema.parse(req.body);
        const suggestion = await reviewSuggestion(req.params.id, req.user.sub, body.status, body.adminComment);
        return res.json(suggestion);
    }
    catch (err) {
        return res.status(400).json({ message: err.message });
    }
});
export default quizRouter;
