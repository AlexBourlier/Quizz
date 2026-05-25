import type { Socket } from "socket.io";
import type { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env.js";
import { buildProgressiveHint, normalizeText } from "../utils/normalize.js";
import { levenshteinDistance } from "../utils/fuzzy.js";
import {
  applyScore,
  createOrActivateGame,
  endGame,
  getLeaderboard,
  getRandomQuestion,
  saveRoundHistory
} from "./quiz.service.js";

type RoomRoundState = {
  gameId: string;
  roomId: string;
  questionId: string;
  answer: string;
  normalizedAnswer: string;
  question: string;
  revealedCount: number;
  hintsUsed: number;
  filters?: { category?: string; difficulty?: string };
  timeout?: NodeJS.Timeout;
  hintInterval?: NodeJS.Timeout;
};

const rounds = new Map<string, RoomRoundState>();
const answerCooldown = new Map<string, number>();

function cooldownKey(roomId: string, userId: string) {
  return `${roomId}:${userId}`;
}

function closeThreshold(value: string) {
  if (value.length <= 5) return 1;
  if (value.length <= 9) return 2;
  return 3;
}

export class QuizBotEngine {
  async start(io: SocketIOServer, roomId: string, filters?: { category?: string; difficulty?: string }) {
    const game = await createOrActivateGame(roomId);
    await this.nextQuestion(io, roomId, game.id, filters);
  }

  stop(roomId: string) {
    const state = rounds.get(roomId);
    if (!state) return;

    if (state.timeout) clearTimeout(state.timeout);
    if (state.hintInterval) clearInterval(state.hintInterval);
    rounds.delete(roomId);
  }

  async submitAnswer(io: SocketIOServer, socket: Socket, payload: {
    roomId: string;
    userId: string;
    username: string;
    answer: string;
  }) {
    const state = rounds.get(payload.roomId);
    if (!state) {
      return { accepted: false, reason: "No active quiz in this room" };
    }

    const key = cooldownKey(payload.roomId, payload.userId);
    const now = Date.now();
    const last = answerCooldown.get(key) ?? 0;
    if (now - last < env.QUIZ_ANSWER_COOLDOWN_MS) {
      return { accepted: false, reason: "Cooldown active" };
    }
    answerCooldown.set(key, now);

    const normalized = normalizeText(payload.answer);
    const isExact = normalized === state.normalizedAnswer;

    if (!isExact) {
      const distance = levenshteinDistance(normalized, state.normalizedAnswer);
      if (distance <= closeThreshold(state.normalizedAnswer)) {
        socket.emit("quiz:close-answer", { roomId: payload.roomId, distance });
      }
      return { accepted: true, reason: "Wrong answer" };
    }

    this.stop(payload.roomId);

    const points = Math.max(12 - state.hintsUsed * 2, 3);
    await applyScore(payload.userId, points, true);
    await saveRoundHistory({
      gameId: state.gameId,
      questionId: state.questionId,
      winnerUserId: payload.userId,
      pointsAwarded: points,
      hintsUsed: state.hintsUsed,
      answerGiven: payload.answer
    });

    io.to(payload.roomId).emit("quiz:winner", {
      roomId: payload.roomId,
      username: payload.username,
      answer: state.answer,
      points
    });

    io.to(payload.roomId).emit("quiz:leaderboard", await getLeaderboard(10));

    setTimeout(() => {
      this.nextQuestion(io, payload.roomId, state.gameId, state.filters).catch((error) => {
        io.to(payload.roomId).emit("quiz:error", { message: String(error) });
      });
    }, 2500);

    return { accepted: true };
  }

  private async nextQuestion(
    io: SocketIOServer,
    roomId: string,
    gameId: string,
    filters?: { category?: string; difficulty?: string }
  ) {
    const question = await getRandomQuestion(filters);
    if (!question) {
      await endGame(gameId);
      io.to(roomId).emit("quiz:ended", { roomId, reason: "No questions available" });
      return;
    }

    const state: RoomRoundState = {
      gameId,
      roomId,
      questionId: question.id,
      question: question.question,
      answer: question.answer,
      normalizedAnswer: normalizeText(question.answer),
      revealedCount: 0,
      hintsUsed: 0,
      filters
    };

    rounds.set(roomId, state);

    const answerLengthWithoutSpaces = [...question.answer].filter((char) => char !== " ").length;

    io.to(roomId).emit("quiz:question", {
      roomId,
      questionId: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      hint: buildProgressiveHint(question.answer, 0)
    });

    state.hintInterval = setInterval(() => {
      const active = rounds.get(roomId);
      if (!active) return;

      active.revealedCount = Math.min(active.revealedCount + 1, answerLengthWithoutSpaces);
      active.hintsUsed += 1;

      io.to(roomId).emit("quiz:hint", {
        roomId,
        hint: buildProgressiveHint(active.answer, active.revealedCount),
        hintsUsed: active.hintsUsed
      });
    }, env.QUIZ_HINT_INTERVAL_MS);

    state.timeout = setTimeout(async () => {
      const active = rounds.get(roomId);
      if (!active) return;

      this.stop(roomId);
      await saveRoundHistory({
        gameId,
        questionId: active.questionId,
        pointsAwarded: 0,
        hintsUsed: active.hintsUsed
      });

      io.to(roomId).emit("quiz:timeout", {
        roomId,
        answer: active.answer
      });

      setTimeout(() => {
        this.nextQuestion(io, roomId, gameId, filters).catch((error) => {
          io.to(roomId).emit("quiz:error", { message: String(error) });
        });
      }, 2000);
    }, env.QUIZ_QUESTION_TIMEOUT_MS);
  }
}

export const quizBotEngine = new QuizBotEngine();
