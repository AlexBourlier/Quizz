import { useEffect } from "react";
import { ChatPanel } from "../components/ChatPanel";
import { QuizPanel } from "../components/QuizPanel";
import { Sidebar } from "../components/Sidebar";
import { useChatRealtime } from "../hooks/useChatRealtime";
import { AppLayout } from "../layouts/AppLayout";
import { api } from "../services/api";
import { connectSocket, disconnectSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useChatStore } from "../store/chat.store";

export function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const rooms = useChatStore((state) => state.rooms);
  const setRooms = useChatStore((state) => state.setRooms);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const messages = useChatStore((state) => (activeRoomId ? state.messagesByRoom[activeRoomId] ?? [] : []));
  const typingUsers = useChatStore((state) => (activeRoomId ? state.typingByRoom[activeRoomId] ?? [] : []));
  const leaderboard = useChatStore((state) => state.quiz.leaderboard);

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    api.get("/rooms").then(({ data }) => setRooms(data));
    api.get("/quiz/leaderboard").then(({ data }) => useChatStore.getState().setLeaderboard(data));
  }, [setRooms]);

  useChatRealtime();

  return (
    <AppLayout>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3">
        <div>
          <h1 className="font-display text-2xl text-white">QuizzTest</h1>
          <p className="text-sm text-slate-300">Connecté en tant que {user?.username}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout().catch(() => undefined);
          }}
          className="rounded-xl border border-coral/40 bg-coral/20 px-4 py-2 text-sm text-coral"
        >
          Déconnexion
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr_20rem]">
        <Sidebar rooms={rooms} activeRoomId={activeRoomId} onSelectRoom={setActiveRoom} />
        <ChatPanel roomId={activeRoomId} messages={messages} typingUsers={typingUsers} />
        <QuizPanel
          roomId={activeRoomId}
          leaderboard={leaderboard}
          canManageQuiz={user?.role === "admin" || user?.role === "moderator"}
        />
      </div>
    </AppLayout>
  );
}
