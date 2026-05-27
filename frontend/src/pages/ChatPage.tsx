import { useEffect, useRef, useState } from "react";

const EMPTY: never[] = [];
import { AdminPanel } from "../components/AdminPanel";
import { ChatPanel } from "../components/ChatPanel";
import { TermsModal } from "../components/TermsModal";
import { ConnectedUsers } from "../components/ConnectedUsers";
import { UserActionModal } from "../components/UserActionModal";
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

const ROOM_ICON: Record<string, string> = { public: "#", private: "🔒", restricted: "🔑" };
const ROLE_DOT: Record<string, string> = { admin: "bg-coral", moderator: "bg-sky", user: "bg-mint" };

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
  const closeDm = useDmStore((s) => s.closeDm);
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

  // Mobile-specific state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [mobileQuizOpen, setMobileQuizOpen] = useState(false);
  const [mobileRoomsExpanded, setMobileRoomsExpanded] = useState(true);
  const [mobileUsersExpanded, setMobileUsersExpanded] = useState(false);
  const [drawerActionTarget, setDrawerActionTarget] = useState<{ id: string; username: string; role: string } | null>(null);

  useEffect(() => {
    try {
      const socket = connectSocket();

      const initContacts = () => {
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
          const auth = useAuthStore.getState();
          if (res.role && auth.user && auth.user.role !== res.role) {
            auth.patchUser({ role: res.role as Role });
          }
        });
      };

      socket.on("connect", () => {
        setSocketReady(true);
        initContacts();
      });

      if (socket.connected) {
        setSocketReady(true);
        initContacts();
      }

      socket.on("connect_error", (err) => {
        setLoadError(`Connexion socket impossible : ${err.message}`);
      });

      socket.on("room:invited", ({ room }: { room: Room }) => {
        useChatStore.getState().addRoom(room);
      });
      socket.on("user:profile-updated", (patch: { avatar?: string }) => {
        useAuthStore.getState().patchUser(patch);
      });

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
      s?.off("connect");
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

  const handleMobileRoomSelect = (roomId: string) => {
    handleRoomSelect(roomId);
    setMobileDrawerOpen(false);
  };

  const handleOpenDm = (userId: string, username: string) => {
    openDm(userId, username);
    setDmMode(true);
  };

  const handleMobileDm = () => {
    setDmMode(true);
    setMobileDrawerOpen(false);
  };

  const handleMobileBack = () => {
    if (activeDmUserId) closeDm();
    else setDmMode(false);
  };

  const isAdmin = user?.role === "admin";
  const isGuest = !!user?.isGuest;

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
      <div className="flex h-full flex-col gap-2 lg:gap-4">

        {/* ── Mobile header ─────────────────────────────────────────── */}
        <header className="flex lg:hidden flex-shrink-0 items-center justify-between gap-2 rounded-2xl border border-white/10 bg-panel/80 px-3 py-2">
          {dmMode && !isGuest ? (
            <button
              type="button"
              onClick={handleMobileBack}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
            >
              ← Retour
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5"
            >
              ☰
            </button>
          )}
          <div className="flex min-w-0 flex-col items-center">
            <span className="max-w-[160px] truncate text-sm font-semibold text-white">
              {dmMode && !isGuest
                ? (activeDmUsername ? `💬 ${activeDmUsername}` : "Messages privés")
                : (rooms.find((r) => r.id === activeRoomId)?.name ?? "ChatQuizz")}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className={`h-1.5 w-1.5 rounded-full ${socketReady ? "bg-mint" : "bg-slate-600"}`} />
              ChatQuizz
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileUserMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-2 py-1.5 text-sm text-slate-200 transition hover:bg-white/5"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky/20 text-xs font-bold text-sky">
                {user?.username?.[0]?.toUpperCase()}
              </span>
            )}
            <span className="text-slate-400">≡</span>
          </button>
        </header>

        {/* ── Mobile user menu dropdown ─────────────────────────────── */}
        {mobileUserMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-40"
              onClick={() => setMobileUserMenuOpen(false)}
            />
            <div className="lg:hidden fixed right-4 top-16 z-50 min-w-[200px] rounded-2xl border border-white/10 bg-panel/95 p-3 shadow-xl backdrop-blur">
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky/20 text-sm font-bold text-sky">
                    {user?.username?.[0]?.toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{user?.username}</p>
                  {isGuest ? (
                    <span className="text-xs text-slate-500">Invité</span>
                  ) : (
                    <span className="text-xs text-slate-400">{user?.role}</span>
                  )}
                </div>
              </div>
              {!isGuest && (
                <>
                  <label className="mb-2 flex cursor-pointer items-center justify-between rounded-xl px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5">
                    <span>Couleur</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowProfile(true); setMobileUserMenuOpen(false); }}
                    className="mb-1 w-full rounded-xl px-2 py-1.5 text-left text-sm text-slate-300 transition hover:bg-white/5"
                  >
                    Mon profil
                  </button>
                </>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => { setShowAdminPanel(true); setMobileUserMenuOpen(false); }}
                  className="mb-1 w-full rounded-xl px-2 py-1.5 text-left text-sm text-sky transition hover:bg-sky/10"
                >
                  Panel Admin
                </button>
              )}
              <button
                type="button"
                onClick={() => { logout().catch(() => undefined); setMobileUserMenuOpen(false); }}
                className="w-full rounded-xl px-2 py-1.5 text-left text-sm text-coral transition hover:bg-coral/10"
              >
                Déconnexion
              </button>
            </div>
          </>
        )}

        {/* ── Desktop header ────────────────────────────────────────── */}
        <header className="hidden lg:flex flex-shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl text-white">ChatQuizz</h1>
            <span className={`h-2 w-2 rounded-full ${socketReady ? "bg-mint" : "bg-slate-600"}`}
              title={socketReady ? "Connecté" : "Connexion..."} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => !isGuest && setShowProfile(true)}
              className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition ${isGuest ? "cursor-default opacity-70" : "hover:bg-white/5"}`}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky/20 text-xs font-bold text-sky">
                  {user?.username?.[0]?.toUpperCase()}
                </span>
              )}
              {user?.username}
              {isGuest ? (
                <span className="ml-0.5 rounded-full bg-slate-600/40 px-1.5 py-0.5 text-xs text-slate-400">invité</span>
              ) : (
                <span className="ml-0.5 rounded-full bg-sky/20 px-1.5 py-0.5 text-xs text-sky">{user?.role}</span>
              )}
            </button>
            {!isGuest && (
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
            {isAdmin && (
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

        {/* ── Mobile left drawer ────────────────────────────────────── */}
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="relative flex h-full w-72 flex-col overflow-y-auto border-r border-white/10 bg-tide/95 p-4 shadow-xl backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-base tracking-wide text-sky">Menu</h2>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg px-2 py-1 text-slate-400 transition hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Salons accordion */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setMobileRoomsExpanded((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-sky transition hover:bg-sky/10"
                >
                  <span>Salons</span>
                  <span className="text-xs">{mobileRoomsExpanded ? "▾" : "▸"}</span>
                </button>
                {mobileRoomsExpanded && (
                  <div className="mt-1 space-y-1 pl-2">
                    {rooms.map((room) => {
                      const count = roomCounts[room.id];
                      const isActive = !dmMode && room.id === activeRoomId;
                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => handleMobileRoomSelect(room.id)}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            isActive ? "bg-coral text-white" : "bg-panel/70 text-slate-200 hover:bg-panel"
                          }`}
                        >
                          <span>
                            <span className="mr-1.5 text-slate-400">{ROOM_ICON[room.type] ?? "#"}</span>
                            {room.name}
                          </span>
                          {count !== undefined && count > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${isActive ? "bg-white/20 text-white" : "bg-sky/20 text-sky"}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Connectés accordion */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setMobileUsersExpanded((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-sky transition hover:bg-sky/10"
                >
                  <span>Connectés <span className="text-slate-400 font-normal">({connectedUsers.length})</span></span>
                  <span className="text-xs">{mobileUsersExpanded ? "▾" : "▸"}</span>
                </button>
                {mobileUsersExpanded && (
                  <div className="mt-1 space-y-1 pl-2">
                    {connectedUsers.length === 0 ? (
                      <p className="px-3 text-xs text-slate-500">Aucun utilisateur</p>
                    ) : (
                      connectedUsers.map((u) => {
                        const isSelf = u.id === user?.id;
                        const clickable = !isSelf && !isGuest;
                        return (
                          <div
                            key={u.id}
                            onClick={clickable ? () => { setDrawerActionTarget({ id: u.id, username: u.username, role: u.role }); setMobileDrawerOpen(false); } : undefined}
                            className={`flex items-center gap-2 rounded-lg bg-ink/70 px-3 py-1.5 ${clickable ? "cursor-pointer hover:bg-ink/90" : ""}`}
                          >
                            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${ROLE_DOT[u.role] ?? "bg-mint"}`} />
                            <span className="flex-1 truncate text-sm text-slate-200">{u.username}</span>
                            {u.role === "admin" && <span className="text-xs font-semibold text-coral">ADM</span>}
                            {u.role === "moderator" && <span className="text-xs font-semibold text-sky">MOD</span>}
                            {isSelf && <span className="text-xs text-slate-500">vous</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* DM button */}
              {!isGuest && (
                <div className="border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={handleMobileDm}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                      dmMode ? "bg-sky/20 text-sky" : "bg-panel/70 text-slate-200 hover:bg-panel"
                    }`}
                  >
                    <span>💬</span>
                    <span className="flex-1 text-left font-medium">Messages privés</span>
                    {totalUnread > 0 && (
                      <span className="rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Main grid ─────────────────────────────────────────────── */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr_20rem]">

          {/* Desktop sidebar only */}
          <div className="hidden lg:block">
            <Sidebar
              rooms={rooms}
              activeRoomId={activeRoomId}
              userRole={user?.role ?? "user"}
              roomCounts={roomCounts}
              dmMode={dmMode}
              totalUnread={totalUnread}
              isGuest={isGuest}
              onSelectRoom={handleRoomSelect}
              onRoomCreated={handleRoomCreated}
              onMessagesClick={() => setDmMode(true)}
            />
          </div>

          {/* DM mode */}
          {dmMode && !isGuest ? (
            <>
              {/* Conversation panel: hidden on mobile when no active convo */}
              <div className={!activeDmUserId ? "hidden lg:flex lg:h-full" : "flex h-full flex-col"}>
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
              </div>
              {/* Contact list: hidden on mobile when a convo is active */}
              <div className={activeDmUserId ? "hidden lg:block" : "block h-full"}>
                <DmContactList />
              </div>
            </>
          ) : (
            <>
              <ChatPanel
                roomId={activeRoomId}
                messages={messages}
                typingUsers={typingUsers}
                currentUserId={user?.id}
                onQuizClick={!isGuest ? () => setMobileQuizOpen(true) : undefined}
                onDmUser={!isGuest ? handleOpenDm : undefined}
              />
              {/* Desktop right column only */}
              <div className="hidden lg:flex h-full min-h-0 flex-col gap-4">
                {isAdmin ? (
                  <div className="min-h-0 flex-1">
                    <QuizPanel
                      roomId={activeRoomId}
                      leaderboard={leaderboard}
                      canManageQuiz
                    />
                  </div>
                ) : !isGuest ? (
                  <QuizSuggestWidget roomId={activeRoomId} />
                ) : null}
                <div className="min-h-0 flex-1">
                  <ConnectedUsers
                    users={connectedUsers}
                    currentUserId={user?.id}
                    isGuest={isGuest}
                    roomId={activeRoomId ?? undefined}
                    onDmUser={handleOpenDm}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile quiz bottom sheet ───────────────────────────────── */}
      {mobileQuizOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/60">
          <div className="w-full rounded-t-2xl border-t border-white/10 bg-panel/95 p-4 shadow-xl backdrop-blur" style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base text-sky">Questions Quiz</h3>
              <button
                type="button"
                onClick={() => setMobileQuizOpen(false)}
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:text-white"
              >
                ✕
              </button>
            </div>
            {isAdmin ? (
              <QuizPanel roomId={activeRoomId} leaderboard={leaderboard} canManageQuiz />
            ) : (
              <QuizSuggestWidget roomId={activeRoomId} />
            )}
          </div>
        </div>
      )}

      {drawerActionTarget && (
        <UserActionModal
          userId={drawerActionTarget.id}
          username={drawerActionTarget.username}
          userRole={drawerActionTarget.role}
          roomId={activeRoomId ?? undefined}
          onClose={() => setDrawerActionTarget(null)}
          onDm={!isGuest ? () => { handleOpenDm(drawerActionTarget.id, drawerActionTarget.username); setDrawerActionTarget(null); } : undefined}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onRoomUpdated={updateRoom}
          onRoomDeleted={removeRoom}
        />
      )}
      {showProfile && !isGuest && <ProfileModal onClose={() => setShowProfile(false)} />}
      {!isGuest && !user?.termsAcceptedAt && <TermsModal onAccepted={() => {}} />}
    </AppLayout>
  );
}
