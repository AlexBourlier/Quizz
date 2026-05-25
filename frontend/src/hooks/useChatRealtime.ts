import { useEffect } from "react";
import { api } from "../services/api";
import { getSocket } from "../sockets/chat.socket";
import { useChatStore } from "../store/chat.store";

export function useChatRealtime() {
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const setMessages = useChatStore((s) => s.setMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const patchMessage = useChatStore((s) => s.patchMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setQuizQuestion = useChatStore((s) => s.setQuizQuestion);
  const setQuizHint = useChatStore((s) => s.setQuizHint);
  const setQuizWinner = useChatStore((s) => s.setQuizWinner);
  const setQuizTimeout = useChatStore((s) => s.setQuizTimeout);
  const setQuizEnded = useChatStore((s) => s.setQuizEnded);
  const setLeaderboard = useChatStore((s) => s.setLeaderboard);
  const setQuizCloseAnswer = useChatStore((s) => s.setQuizCloseAnswer);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("message:new", appendMessage);
    socket.on("message:updated", patchMessage);
    socket.on("message:deleted", ({ messageId }: { messageId: string }) => {
      if (!activeRoomId) return;
      removeMessage(activeRoomId, messageId);
    });

    socket.on("typing:update", ({ roomId, username, typing }: { roomId: string; username: string; typing: boolean }) => {
      const store = useChatStore.getState();
      const current = store.typingByRoom[roomId] ?? [];
      const updated = typing
        ? Array.from(new Set([...current, username]))
        : current.filter((u) => u !== username);
      setTyping(roomId, updated);
    });

    socket.on("quiz:question", ({ question, hint, category, difficulty }: { question: string; hint: string; category: string; difficulty: string }) => {
      setQuizQuestion(question, hint, category, difficulty);
    });
    socket.on("quiz:hint", ({ hint, hintsUsed }: { hint: string; hintsUsed: number }) => {
      setQuizHint(hint, hintsUsed);
    });
    socket.on("quiz:winner", (data: { username: string; answer: string; points: number }) => {
      setQuizWinner(data);
    });
    socket.on("quiz:timeout", ({ answer }: { answer: string }) => {
      setQuizTimeout(answer);
    });
    socket.on("quiz:ended", () => {
      setQuizEnded();
    });
    socket.on("quiz:close-answer", () => {
      setQuizCloseAnswer(true);
      setTimeout(() => setQuizCloseAnswer(false), 2000);
    });
    socket.on("quiz:leaderboard", setLeaderboard);

    return () => {
      socket.off("message:new", appendMessage);
      socket.off("message:updated", patchMessage);
      socket.off("message:deleted");
      socket.off("typing:update");
      socket.off("quiz:question");
      socket.off("quiz:hint");
      socket.off("quiz:winner");
      socket.off("quiz:timeout");
      socket.off("quiz:ended");
      socket.off("quiz:close-answer");
      socket.off("quiz:leaderboard");
    };
  }, [activeRoomId, appendMessage, patchMessage, removeMessage, setLeaderboard, setQuizCloseAnswer, setQuizEnded, setQuizHint, setQuizQuestion, setQuizTimeout, setQuizWinner, setTyping]);

  useEffect(() => {
    if (!activeRoomId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("room:join", { roomId: activeRoomId }, async (response: { ok: boolean; messages?: unknown[] }) => {
      if (response.ok && response.messages) {
        setMessages(activeRoomId, response.messages as never);
      } else {
        const { data } = await api.get(`/messages/rooms/${activeRoomId}`);
        setMessages(activeRoomId, data);
      }
    });

    return () => {
      socket.emit("room:leave", { roomId: activeRoomId });
    };
  }, [activeRoomId, setMessages]);
}
