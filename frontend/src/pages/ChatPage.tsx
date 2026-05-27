import { useEffect, useRef, useState } from "react";

const EMPTY: never[] = [];
import { AdminPanel } from "../components/AdminPanel";
import { ChatPanel } from "../components/ChatPanel";
import { TermsModal } from "../components/TermsModal";
import { ConnectedUsers } from "../components/ConnectedUsers";
import { DmContactList } from "../components/DmContactList";
import { DmConversationPanel } from "../components/DmConversationPanel";
import { ProfileModal } from "../components/ProfileModal";
import { QuizPanel } from "../components/QuizPanel";
import { QuizSuggestWidget } from "../components/QuizSuggestWidget";
import { Sidebar } from "../components/Sidebar";
import { useChatRealtime } from "../hooks/useChatRealtime";
import { AppLayout } from "../layouts/AppLayout";
import { api } from "../services/api";
import { connectSocket, disconnectSocket, getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useChatStore } from "../store/chat.store";
import { useContactStore } from "../store/contact.store";
import { useDmStore } from "../store/dm.store";
import type { ContactRequest, DmContact, Role, Room } from "../types";

export function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const rooms = useChatStore((state) => state.rooms);
  const setRooms = useChatStore((state) => state.setRooms);
  const updateRoom = useChatStore((state) => state.updateRoom);
  const removeRoom = useChatStore((state) => state.removeRoom);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const messages = useChatStore((state) => (activeRoomId ? state.messagesByRoom[activeRoomId] : undefined) ?? EMPTY);
  const typingUsers = useChatStore((state) => (activeRoomId ? state.typingByRoom[activeRoomId] : undefined) ?? EMPTY);
  const leaderboard = useChatStore((state) => state.quiz.leaderboard);
  const connectedUsers = useChatStore((state) => (activeRoomId ? state.connectedUsersByRoom[activeRoomId] : undefined) ?? EMPTY);
  const roomCounts = useChatStore((state) => state.roomCountsByRoomId);

  const dmMode = useDmStore((s) => s.dmMode);
  const setDmMode = useDmStore((s) => s.setDmMode);
  const openDm = useDmStore((s) => s.openDm);
  const activeDmUserId = useDmStore((s) => s.activeDmUserId);
  const activeDmUsername = useDmStore((s) => s.activeDmUsername);
  const totalUnread = useDmStore((s) =>
    Object.values(s.unreadCounts).reduce((sum, n) => sum + n, 0)
  );

  const [loadError, setLoadError] = useState<string | null>(null);
  const [socketReady, setSocketReady] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [color, setColor] = useState(user?.color ?? "#a3e4d7");
  const colorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const socket = connectSocket();

      socket.on("connect", () => {
        setSocketReady(true);

        // Load all contact/block state once connected
        socket.emit("contact:init", {}, (res: {
          ok: boolean;
          role?: string;
          contacts?: DmContact[];
          sentPendingIds?: string[];
          pendingRequests?: ContactRequest[];
          blockedUsers?: { id: string; blockedId: string; blocked: { id: string; username: string } }[];
        }) => {
          if (!res.ok) return;
          const cs = useContactStore.getState();
          cs.setContacts(res.contacts ?? []);
          cs.setSentPendingIds(res.sentPendingIds ?? []);
          cs.setIncomingRequests(res.pendingRequests ?? []);
          cs.setBlockedUsers(res.blockedUsers ?? []);
          // Sync role from DB in case JWT is stale (e.g. promoted while session was active)
          const auth = useAuthStore.getState();
          if (res.role && auth.user && auth.user.role !== res.role) {
            auth.patchUser({ role: res.role as Role });
          }
        });
      });

      socket.on("connect_error", (err) => {
        setLoadError(`Connexion socket impossible : ${err.message}`);
      });

      socket.on("room:invited", ({ room }: { room: Room }) => {
        useChatStore.getState().addRoom(room);
      });
      socket.on("user:profile-updated", (patch: { avatar?: string }) => {
        useAuthStore.getState().patchUser(patch);
      });

      // Contact request events
      socket.on("contact:request-received", ({ request }: { request: ContactRequest }) => {
        useContactStore.getState().addIncomingRequest(request);
      });
      socket.on("contact:request-accepted", ({ contact }: { contact: DmContact }) => {
        const cs = useContactStore.getState();
        cs.addContact(contact);
        cs.removeSentPendingId(contact.id);
      });
      socket.on("contact:request-rejected", ({ recipientId }: { recipientId: string }) => {
        useContactStore.getState().removeSentPendingId(recipientId);
      });
    } catch (err) {
      setLoadError(`Erreur socket : ${String(err)}`);
    }
    return () => {
      const s = getSocket();
      s?.off("room:invited");
      s?.off("user:profile-updated");
      s?.off("contact:request-received");
      s?.off("contact:request-accepted");
      s?.off("contact:request-rejected");
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    api.get("/rooms")
      .then(({ data }) => setRooms(data))
      .catch((err) => setLoadError(`Erreur chargement salons : ${err.message}`));
    api.get("/quiz/leaderboard")
      .then(({ data }) => useChatStore.getState().setLeaderboard(data))
      .catch(() => undefined);
  }, [setRooms]);

  useChatRealtime();

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (colorDebounce.current) clearTimeout(colorDebounce.current);
    colorDebounce.current = setTimeout(() => {
      api.patch("/users/me/color", { color: newColor }).catch(() => undefined);
    }, 600);
  };

  const handleRoomCreated = (room: Room) => {
    setRooms([...rooms, room]);
    setActiveRoom(room.id);
  };

  const handleRoomSelect = (roomId: string) => {
    setActiveRoom(roomId);
    setDmMode(false);
  };

  const handleOpenDm = (userId: string, username: string) => {
    openDm(userId, username);
    setDmMode(true);
  };

  if (loadError) {
    return (
      <AppLayout>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="rounded-2xl border border-coral/40 bg-panel p-6 text-center">
            <p className="font-display text-lg text-coral">Problème de connexion</p>
            <p className="mt-2 text-sm text-slate-300">{loadError}</p>
            <button type="button" onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white">
              Réessayer
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-full flex-col gap-4">
        <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl text-white">QuizzTest</h1>
            <span className={`h-2 w-2 rounded-full ${socketReady ? "bg-mint" : "bg-slate-600"}`}
              title={socketReady ? "Connecté" : "Connexion..."} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => !user?.isGuest && setShowProfile(true)}
              className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition ${user?.isGuest ? "cursor-default opacity-70" : "hover:bg-white/5"}`}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky/20 text-xs font-bold text-sky">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              )}
              {user?.username}
              {user?.isGuest ? (
                <span className="ml-0.5 rounded-full bg-slate-600/40 px-1.5 py-0.5 text-xs text-slate-400">invité</span>
              ) : (
                <span className="ml-0.5 rounded-full bg-sky/20 px-1.5 py-0.5 text-xs text-sky">{user?.role}</span>
              )}
            </button>
            {!user?.isGuest && (
              <label className="flex cursor-pointer items-center gap-1.5" title="Couleur de police">
                <span className="text-xs text-slate-400">Couleur</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
              </label>
            )}
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={() => setShowAdminPanel(true)}
                className="rounded-xl border border-sky/40 bg-sky/10 px-3 py-2 text-sm text-sky transition hover:bg-sky/20"
              >
                Panel Admin
              </button>
            )}
          </div>
          <button type="button" onClick={() => logout().catch(() => undefined)}
            className="rounded-xl border border-coral/40 bg-coral/20 px-4 py-2 text-sm text-coral transition hover:bg-coral/30">
            Déconnexion
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr_20rem]">
          <Sidebar
            rooms={rooms}
            activeRoomId={activeRoomId}
            userRole={user?.role ?? "user"}
            roomCounts={roomCounts}
            dmMode={dmMode}
            totalUnread={totalUnread}
            isGuest={user?.isGuest}
            onSelectRoom={handleRoomSelect}
            onRoomCreated={handleRoomCreated}
            onMessagesClick={() => setDmMode(true)}
          />

          {dmMode && !user?.isGuest ? (
            <>
              {activeDmUserId && activeDmUsername ? (
                <DmConversationPanel
                  recipientId={activeDmUserId}
                  recipientUsername={activeDmUsername}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-panel/70">
                  <p className="text-sm text-slate-400">
                    ← Sélectionne une conversation dans la liste
                  </p>
                </div>
              )}
              <DmContactList />
            </>
          ) : (
            <>
              <ChatPanel
                roomId={activeRoomId}
                messages={messages}
                typingUsers={typingUsers}
                currentUserId={user?.id}
              />
              <div className="flex h-full min-h-0 flex-col gap-4">
                {user?.role === "admin" ? (
                  <div className="min-h-0 flex-1">
                    <QuizPanel
                      roomId={activeRoomId}
                      leaderboard={leaderboard}
                      canManageQuiz
                    />
                  </div>
                ) : !user?.isGuest ? (
                  <QuizSuggestWidget roomId={activeRoomId} />
                ) : null}
                <div className="min-h-0 flex-1">
                  <ConnectedUsers
                    users={connectedUsers}
                    currentUserId={user?.id}
                    isGuest={user?.isGuest}
                    onDmUser={handleOpenDm}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onRoomUpdated={updateRoom}
          onRoomDeleted={removeRoom}
        />
      )}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {!user?.isGuest && !user?.termsAcceptedAt && <TermsModal onAccepted={() => {}} />}
    </AppLayout>
  );
}
