import { QuizGameStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export async function createQuestion(data: {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}) {
  return prisma.quizQuestion.create({ data });
}

export async function createOrActivateGame(roomId: string) {
  const active = await prisma.quizGame.findFirst({
    where: { roomId, status: QuizGameStatus.active }
  });

  if (active) {
    return active;
  }

  return prisma.quizGame.create({
    data: {
      roomId,
      status: QuizGameStatus.active,
      startedAt: new Date()
    }
  });
}

export async function endGame(gameId: string) {
  return prisma.quizGame.update({
    where: { id: gameId },
    data: {
      status: QuizGameStatus.finished,
      endedAt: new Date()
    }
  });
}

export async function getRandomQuestion(filters?: { category?: string; difficulty?: string }) {
  const where = {
    ...(filters?.category ? { category: filters.category } : {}),
    ...(filters?.difficulty ? { difficulty: filters.difficulty } : {})
  };

  const total = await prisma.quizQuestion.count({ where });
  if (total === 0) {
    return null;
  }

  const skip = Math.floor(Math.random() * total);
  return prisma.quizQuestion.findFirst({ where, skip });
}

export async function applyScore(userId: string, points: number, wonRound = false) {
  return prisma.quizScore.upsert({
    where: { userId },
    update: {
      score: { increment: points },
      wins: wonRound ? { increment: 1 } : undefined,
      answersCount: { increment: 1 }
    },
    create: {
      userId,
      score: points,
      wins: wonRound ? 1 : 0,
      answersCount: 1
    }
  });
}

export async function getLeaderboard(limit = 20) {
  return prisma.quizScore.findMany({
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: [{ score: "desc" }, { wins: "desc" }],
    take: limit
  });
}

export async function saveRoundHistory(data: {
  gameId: string;
  questionId: string;
  winnerUserId?: string;
  pointsAwarded: number;
  hintsUsed: number;
  answerGiven?: string;
}) {
  return prisma.quizRoundHistory.create({ data });
}
