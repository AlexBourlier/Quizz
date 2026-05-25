import type { Socket } from "socket.io";
import type { Server as SocketIOServer } from "socket.io";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { buildHintFromPositions, normalizeText } from "../utils/normalize.js";
import { levenshteinDistance } from "../utils/fuzzy.js";
import { createMessage } from "./messages.service.js";
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
  shuffledIndices: number[];
  timeout?: NodeJS.Timeout;
  hintTimeouts: NodeJS.Timeout[];
};

const rounds = new Map<string, RoomRoundState>();
const answerCooldown = new Map<string, number>();

let cachedBotUserId: string | null | undefined = undefined;

async function getBotUserId(): Promise<string | null> {
  if (cachedBotUserId !== undefined) return cachedBotUserId;
  const bot = await prisma.user.findUnique({
    where: { email: "quizbot@quizztest.local" },
    select: { id: true }
  });
  const id: string | null = bot?.id ?? null;
  cachedBotUserId = id;
  return id;
}

async function postBotMessage(io: SocketIOServer, roomId: string, content: string) {
  const botId = await getBotUserId();
  if (!botId) return;
  const message = await createMessage({ roomId, userId: botId, content });
  io.to(roomId).emit("message:new", message);
}

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
    this.stop(roomId); // clear any running timers before starting a new game
    const game = await createOrActivateGame(roomId);
    await this.nextQuestion(io, roomId, game.id, filters);
  }

  isRunning(roomId: string): boolean {
    return rounds.has(roomId);
  }

  async autoStartInRoom(io: SocketIOServer, roomName: string) {
    const room = await prisma.room.findUnique({ where: { name: roomName }, select: { id: true } });
    if (!room || rounds.has(room.id)) return;
    await this.start(io, room.id);
  }

  stop(roomId: string) {
    const state = rounds.get(roomId);
    if (!state) return;

    if (state.timeout) clearTimeout(state.timeout);
    for (const t of state.hintTimeouts) clearTimeout(t);
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

    const leaderboard = await getLeaderboard(5);
    const board = leaderboard
      .map((e: { score: number; user: { username: string } }, i: number) =>
        `${i + 1}. ${e.user.username} — ${e.score} pts`
      )
      .join("\n");

    await postBotMessage(
      io,
      payload.roomId,
      `Bravo ${payload.username} ! La reponse etait : "${state.answer}" (+${points} pts)\n\nClassement :\n${board}`
    );

    io.to(payload.roomId).emit("quiz:leaderboard", leaderboard);

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
      await postBotMessage(io, roomId, "Quiz termine. Plus de questions disponibles.");
      return;
    }

    // Pre-shuffle the positions of non-space characters so hints reveal random letters
    const nonSpaceIndices = [...question.answer]
      .reduce<number[]>((acc, ch, i) => { if (ch !== " ") acc.push(i); return acc; }, []);
    for (let i = nonSpaceIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonSpaceIndices[i], nonSpaceIndices[j]] = [nonSpaceIndices[j], nonSpaceIndices[i]];
    }

    const initialHint = buildHintFromPositions(question.answer, new Set());

    const state: RoomRoundState = {
      gameId,
      roomId,
      questionId: question.id,
      question: question.question,
      answer: question.answer,
      normalizedAnswer: normalizeText(question.answer),
      revealedCount: 0,
      hintsUsed: 0,
      filters,
      shuffledIndices: nonSpaceIndices,
      hintTimeouts: [],
    };

    rounds.set(roomId, state);

    io.to(roomId).emit("quiz:question", {
      roomId,
      questionId: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      hint: initialHint
    });

    await postBotMessage(
      io,
      roomId,
      `[${question.category}] ${question.question}\nIndice : ${initialHint}`
    );

    // Exactly 3 hints at +30s, +60s, +90s — each reveals one more random letter
    for (let i = 1; i <= 3; i++) {
      const t = setTimeout(() => {
        void (async () => {
          const active = rounds.get(roomId);
          if (!active) return;

          active.revealedCount = Math.min(active.revealedCount + 1, active.shuffledIndices.length);
          active.hintsUsed += 1;
          const hint = buildHintFromPositions(
            active.answer,
            new Set(active.shuffledIndices.slice(0, active.revealedCount))
          );

          io.to(roomId).emit("quiz:hint", { roomId, hint, hintsUsed: active.hintsUsed });
          await postBotMessage(io, roomId, `Indice : ${hint}`);
        })().catch(console.error);
      }, i * env.QUIZ_HINT_INTERVAL_MS);
      state.hintTimeouts.push(t);
    }

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

      io.to(roomId).emit("quiz:timeout", { roomId, answer: active.answer });

      await postBotMessage(io, roomId, `Temps ecoule ! La reponse etait : "${active.answer}"`);

      setTimeout(() => {
        this.nextQuestion(io, roomId, gameId, filters).catch((error) => {
          io.to(roomId).emit("quiz:error", { message: String(error) });
        });
      }, 2000);
    }, env.QUIZ_QUESTION_TIMEOUT_MS);
  }
}

export const quizBotEngine = new QuizBotEngine();
