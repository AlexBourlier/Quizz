import { prisma } from "../config/prisma.js";
import { sendAdminAlert } from "./email.service.js";
import { env } from "../config/env.js";

type SubmitInput = {
  type: "new_question" | "correction";
  submitterId: string;
  questionId?: string;
  question: string;
  answer: string;
  category: string;
  difficulty: string;
};

const SUBMITTER_SELECT = { id: true, username: true } as const;
const REVIEWER_SELECT  = { id: true, username: true } as const;
const ORIGINAL_SELECT  = { id: true, question: true, answer: true, category: true, difficulty: true } as const;

export async function submitSuggestion(data: SubmitInput) {
  if (data.type === "correction" && !data.questionId) {
    throw new Error("questionId requis pour une correction");
  }
  const suggestion = await prisma.quizSuggestion.create({
    data: {
      type:        data.type,
      submitterId: data.submitterId,
      questionId:  data.questionId ?? null,
      question:    data.question,
      answer:      data.answer,
      category:    data.category,
      difficulty:  data.difficulty,
    },
    include: {
      submitter: { select: SUBMITTER_SELECT },
      originalQ: { select: ORIGINAL_SELECT },
    },
  });

  const typeLabel = data.type === "correction" ? "Correction" : "Nouvelle question";
  sendAdminAlert(
    `Suggestion — ${typeLabel}`,
    `<p>Nouvelle suggestion soumise par <strong>${suggestion.submitter.username}</strong>.</p>
     <p><strong>Type :</strong> ${typeLabel}</p>
     <p><strong>Question :</strong> ${data.question}</p>
     <p><strong>Réponse :</strong> ${data.answer}</p>
     <p><strong>Catégorie :</strong> ${data.category} — ${data.difficulty}</p>
     <p><a href="${env.FRONTEND_URL}">Accéder à l'application</a></p>`,
  ).catch(() => undefined);

  return suggestion;
}

export async function getMySuggestions(submitterId: string) {
  return prisma.quizSuggestion.findMany({
    where: { submitterId },
    include: {
      reviewer:  { select: REVIEWER_SELECT },
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

export async function reviewSuggestion(
  id: string,
  reviewedById: string,
  status: "accepted" | "rejected",
  adminComment?: string,
) {
  const suggestion = await prisma.quizSuggestion.findUnique({ where: { id } });
  if (!suggestion) throw new Error("Suggestion introuvable");
  if (suggestion.status !== "pending") throw new Error("Suggestion déjà traitée");

  // If accepted: materialise the suggestion in the question bank
  if (status === "accepted") {
    if (suggestion.type === "new_question") {
      await prisma.quizQuestion.create({
        data: {
          question:   suggestion.question,
          answer:     suggestion.answer,
          category:   suggestion.category,
          difficulty: suggestion.difficulty,
        },
      });
    } else if (suggestion.type === "correction" && suggestion.questionId) {
      await prisma.quizQuestion.update({
        where: { id: suggestion.questionId },
        data: {
          answer:     suggestion.answer,
          category:   suggestion.category,
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
      reviewer:  { select: REVIEWER_SELECT },
      originalQ: { select: ORIGINAL_SELECT },
    },
  });
}
