import { create } from "zustand";
import type { ConnectedUser, LeaderboardEntry, Message, Room } from "../types";

type QuizState = {
  active: boolean;
  quizRoomId?: string;
  question?: string;
  hint?: string;
  category?: string;
  difficulty?: string;
  hintsUsed: number;
  leaderboard: LeaderboardEntry[];
  lastWinner?: { username: string; answer: string; points: number };
  timeoutAnswer?: string;
  closeAnswer?: boolean;
};

type ChatState = {
  rooms: Room[];
  activeRoomId: string | null;
  messagesByRoom: Record<string, Message[]>;
  connectedUsersByRoom: Record<string, ConnectedUser[]>;
  roomCountsByRoomId: Record<string, number>;
  typingByRoom: Record<string, string[]>;
  quiz: QuizState;
  setRooms: (rooms: Room[]) => void;
  setActiveRoom: (roomId: string) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  patchMessage: (message: Message) => void;
  removeMessage: (roomId: string, messageId: string) => void;
  setConnectedUsers: (roomId: string, users: ConnectedUser[]) => void;
  setRoomCount: (roomId: string, count: number) => void;
  setTyping: (roomId: string, usernames: string[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setQuizQuestion: (roomId: string, question: string, hint: string, category?: string, difficulty?: string) => void;
  setQuizHint: (hint: string, hintsUsed?: number) => void;
  setQuizWinner: (winner: { username: string; answer: string; points: number }) => void;
  setQuizTimeout: (answer: string) => void;
  setQuizEnded: () => void;
  setQuizCloseAnswer: (close: boolean) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  activeRoomId: null,
  messagesByRoom: {},
  connectedUsersByRoom: {},
  roomCountsByRoomId: {},
  typingByRoom: {},
  quiz: { active: false, hintsUsed: 0, leaderboard: [] },
  setRooms: (rooms) => set({ rooms, activeRoomId: rooms[0]?.id ?? null }),
  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),
  setMessages: (roomId, messages) =>
    set((state) => ({ messagesByRoom: { ...state.messagesByRoom, [roomId]: messages } })),
  appendMessage: (message) =>
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [message.roomId]: [...(state.messagesByRoom[message.roomId] ?? []), message]
      }
    })),
  patchMessage: (message) =>
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [message.roomId]: (state.messagesByRoom[message.roomId] ?? []).map((item) =>
          item.id === message.id ? message : item
        )
      }
    })),
  removeMessage: (roomId, messageId) =>
    set((state) => ({
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: (state.messagesByRoom[roomId] ?? []).filter((item) => item.id !== messageId)
      }
    })),
  setConnectedUsers: (roomId, users) =>
    set((state) => ({ connectedUsersByRoom: { ...state.connectedUsersByRoom, [roomId]: users } })),
  setRoomCount: (roomId, count) =>
    set((state) => ({ roomCountsByRoomId: { ...state.roomCountsByRoomId, [roomId]: count } })),
  setTyping: (roomId, usernames) =>
    set((state) => ({ typingByRoom: { ...state.typingByRoom, [roomId]: usernames } })),
  setLeaderboard: (entries) => set((state) => ({ quiz: { ...state.quiz, leaderboard: entries } })),
  setQuizQuestion: (roomId, question, hint, category, difficulty) =>
    set((state) => ({
      quiz: {
        ...state.quiz,
        active: true,
        quizRoomId: roomId,
        question,
        hint,
        category,
        difficulty,
        hintsUsed: 0,
        lastWinner: undefined,
        timeoutAnswer: undefined,
        closeAnswer: false
      }
    })),
  setQuizHint: (hint, hintsUsed) =>
    set((state) => ({
      quiz: { ...state.quiz, hint, hintsUsed: hintsUsed ?? state.quiz.hintsUsed }
    })),
  setQuizWinner: (winner) =>
    set((state) => ({ quiz: { ...state.quiz, active: false, lastWinner: winner } })),
  setQuizTimeout: (answer) =>
    set((state) => ({ quiz: { ...state.quiz, active: false, timeoutAnswer: answer } })),
  setQuizEnded: () =>
    set((state) => ({ quiz: { ...state.quiz, active: false, quizRoomId: undefined, question: undefined, hint: undefined } })),
  setQuizCloseAnswer: (close) =>
    set((state) => ({ quiz: { ...state.quiz, closeAnswer: close } }))
}));
