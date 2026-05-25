import { useEffect, useState } from "react";

const EMPTY: never[] = [];
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
  const messages = useChatStore((state) => (activeRoomId ? state.messagesByRoom[activeRoomId] : undefined) ?? EMPTY);
  const typingUsers = useChatStore((state) => (activeRoomId ? state.typingByRoom[activeRoomId] : undefined) ?? EMPTY);
  const leaderboard = useChatStore((state) => state.quiz.leaderboard);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    try {
      const socket = connectSocket();
      socket.on("connect", () => setSocketReady(true));
      socket.on("connect_error", (err) => {
        console.error("[socket] connection error:", err.message);
        setLoadError(`Connexion socket impossible : ${err.message}`);
      });
    } catch (err) {
      setLoadError(`Erreur socket : ${String(err)}`);
    }
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    api
      .get("/rooms")
      .then(({ data }) => setRooms(data))
      .catch((err) => {
        console.error("[api] /rooms error:", err);
        setLoadError(`Erreur chargement salons : ${err.message}`);
      });
    api
      .get("/quiz/leaderboard")
      .then(({ data }) => useChatStore.getState().setLeaderboard(data))
      .catch((err) => console.error("[api] /quiz/leaderboard error:", err));
  }, [setRooms]);

  useChatRealtime();

  if (loadError) {
    return (
      <AppLayout>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="rounded-2xl border border-coral/40 bg-panel p-6 text-center">
            <p className="font-display text-lg text-coral">Problème de connexion</p>
            <p className="mt-2 text-sm text-slate-300">{loadError}</p>
            <p className="mt-2 text-xs text-slate-500">Vérifie que le backend tourne sur le port 4000.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white"
            >
              Réessayer
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl text-white">QuizzTest</h1>
          <span className={`h-2 w-2 rounded-full ${socketReady ? "bg-mint" : "bg-slate-600"}`} title={socketReady ? "Connecté" : "Connexion..."} />
        </div>
        <p className="text-sm text-slate-300">
          {user?.username} <span className="ml-1 rounded-full bg-sky/20 px-2 py-0.5 text-xs text-sky">{user?.role}</span>
        </p>
        <button
          type="button"
          onClick={() => logout().catch(() => undefined)}
          className="rounded-xl border border-coral/40 bg-coral/20 px-4 py-2 text-sm text-coral transition hover:bg-coral/30"
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
