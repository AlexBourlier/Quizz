import { createQuestionSchema } from "../modules/quiz/quiz.validators.js";
import { createQuestion, getLeaderboard } from "../services/quiz.service.js";
export async function createQuestionController(req, res) {
    try {
        const parsed = createQuestionSchema.parse(req.body);
        const question = await createQuestion(parsed);
        return res.status(201).json(question);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function leaderboardController(_req, res) {
    const leaderboard = await getLeaderboard();
    return res.json(leaderboard);
}
