import { prisma } from "../config/prisma.js";
const SUBMITTER_SELECT = { id: true, username: true };
const REVIEWER_SELECT = { id: true, username: true };
const ORIGINAL_SELECT = { id: true, question: true, answer: true, category: true, difficulty: true };
export async function submitSuggestion(data) {
    if (data.type === "correction" && !data.questionId) {
        throw new Error("questionId requis pour une correction");
    }
    return prisma.quizSuggestion.create({
        data: {
            type: data.type,
            submitterId: data.submitterId,
            questionId: data.questionId ?? null,
            question: data.question,
            answer: data.answer,
            category: data.category,
            difficulty: data.difficulty,
        },
        include: {
            submitter: { select: SUBMITTER_SELECT },
            originalQ: { select: ORIGINAL_SELECT },
        },
    });
}
export async function getMySuggestions(submitterId) {
    return prisma.quizSuggestion.findMany({
        where: { submitterId },
        include: {
            reviewer: { select: REVIEWER_SELECT },
            originalQ: { select: ORIGINAL_SELECT },
        },
        orderBy: { createdAt: "desc" },
    });
}
export async function getPendingSuggestions() {
    return prisma.quizSuggestion.findMany({
        where: { status: "pending" },
        include: {
            submitter: { select: SUBMITTER_SELECT },
            originalQ: { select: ORIGINAL_SELECT },
        },
        orderBy: { createdAt: "asc" },
    });
}
export async function reviewSuggestion(id, reviewedById, status, adminComment) {
    const suggestion = await prisma.quizSuggestion.findUnique({ where: { id } });
    if (!suggestion)
        throw new Error("Suggestion introuvable");
    if (suggestion.status !== "pending")
        throw new Error("Suggestion déjà traitée");
    // If accepted: materialise the suggestion in the question bank
    if (status === "accepted") {
        if (suggestion.type === "new_question") {
            await prisma.quizQuestion.create({
                data: {
                    question: suggestion.question,
                    answer: suggestion.answer,
                    category: suggestion.category,
                    difficulty: suggestion.difficulty,
                },
            });
        }
        else if (suggestion.type === "correction" && suggestion.questionId) {
            await prisma.quizQuestion.update({
                where: { id: suggestion.questionId },
                data: {
                    answer: suggestion.answer,
                    category: suggestion.category,
                    difficulty: suggestion.difficulty,
                },
            });
        }
    }
    return prisma.quizSuggestion.update({
        where: { id },
        data: { status, adminComment: adminComment ?? null, reviewedById },
        include: {
            submitter: { select: SUBMITTER_SELECT },
            reviewer: { select: REVIEWER_SELECT },
            originalQ: { select: ORIGINAL_SELECT },
        },
    });
}
