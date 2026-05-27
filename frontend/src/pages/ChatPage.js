import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
const EMPTY = [];
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
const ROOM_ICON = { public: "#", private: "🔒", restricted: "🔑" };
const ROLE_DOT = { admin: "bg-coral", moderator: "bg-sky", user: "bg-mint" };
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
    const totalUnread = useDmStore((s) => Object.values(s.unreadCounts).reduce((sum, n) => sum + n, 0));
    const [loadError, setLoadError] = useState(null);
    const [socketReady, setSocketReady] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [color, setColor] = useState(user?.color ?? "#a3e4d7");
    const colorDebounce = useRef(null);
    // Mobile-specific state
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
    const [mobileQuizOpen, setMobileQuizOpen] = useState(false);
    const [mobileRoomsExpanded, setMobileRoomsExpanded] = useState(true);
    const [mobileUsersExpanded, setMobileUsersExpanded] = useState(false);
    useEffect(() => {
        try {
            const socket = connectSocket();
            const initContacts = () => {
                socket.emit("contact:init", {}, (res) => {
                    if (!res.ok)
                        return;
                    const cs = useContactStore.getState();
                    cs.setContacts(res.contacts ?? []);
                    cs.setSentPendingIds(res.sentPendingIds ?? []);
                    cs.setIncomingRequests(res.pendingRequests ?? []);
                    cs.setBlockedUsers(res.blockedUsers ?? []);
                    const auth = useAuthStore.getState();
                    if (res.role && auth.user && auth.user.role !== res.role) {
                        auth.patchUser({ role: res.role });
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
            socket.on("room:invited", ({ room }) => {
                useChatStore.getState().addRoom(room);
            });
            socket.on("user:profile-updated", (patch) => {
                useAuthStore.getState().patchUser(patch);
            });
            socket.on("contact:request-received", ({ request }) => {
                useContactStore.getState().addIncomingRequest(request);
            });
            socket.on("contact:request-accepted", ({ contact }) => {
                const cs = useContactStore.getState();
                cs.addContact(contact);
                cs.removeSentPendingId(contact.id);
            });
            socket.on("contact:request-rejected", ({ recipientId }) => {
                useContactStore.getState().removeSentPendingId(recipientId);
            });
        }
        catch (err) {
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
    const handleColorChange = (newColor) => {
        setColor(newColor);
        if (colorDebounce.current)
            clearTimeout(colorDebounce.current);
        colorDebounce.current = setTimeout(() => {
            api.patch("/users/me/color", { color: newColor }).catch(() => undefined);
        }, 600);
    };
    const handleRoomCreated = (room) => {
        setRooms([...rooms, room]);
        setActiveRoom(room.id);
    };
    const handleRoomSelect = (roomId) => {
        setActiveRoom(roomId);
        setDmMode(false);
    };
    const handleMobileRoomSelect = (roomId) => {
        handleRoomSelect(roomId);
        setMobileDrawerOpen(false);
    };
    const handleOpenDm = (userId, username) => {
        openDm(userId, username);
        setDmMode(true);
    };
    const handleMobileDm = () => {
        setDmMode(true);
        setMobileDrawerOpen(false);
    };
    const handleMobileBack = () => {
        if (activeDmUserId)
            closeDm();
        else
            setDmMode(false);
    };
    const isAdmin = user?.role === "admin";
    const isGuest = !!user?.isGuest;
    if (loadError) {
        return (_jsx(AppLayout, { children: _jsx("div", { className: "flex min-h-[80vh] items-center justify-center", children: _jsxs("div", { className: "rounded-2xl border border-coral/40 bg-panel p-6 text-center", children: [_jsx("p", { className: "font-display text-lg text-coral", children: "Probl\u00E8me de connexion" }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: loadError }), _jsx("button", { type: "button", onClick: () => window.location.reload(), className: "mt-4 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white", children: "R\u00E9essayer" })] }) }) }));
    }
    return (_jsxs(AppLayout, { children: [_jsxs("div", { className: "flex h-full flex-col gap-2 lg:gap-4", children: [_jsxs("header", { className: "flex lg:hidden flex-shrink-0 items-center justify-between gap-2 rounded-2xl border border-white/10 bg-panel/80 px-3 py-2", children: [dmMode && !isGuest ? (_jsx("button", { type: "button", onClick: handleMobileBack, className: "flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5", children: "\u2190 Retour" })) : (_jsx("button", { type: "button", onClick: () => setMobileDrawerOpen(true), className: "rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5", children: "\u2630" })), _jsxs("div", { className: "flex min-w-0 flex-col items-center", children: [_jsx("span", { className: "max-w-[160px] truncate text-sm font-semibold text-white", children: dmMode && !isGuest
                                            ? (activeDmUsername ? `💬 ${activeDmUsername}` : "Messages privés")
                                            : (rooms.find((r) => r.id === activeRoomId)?.name ?? "ChatQuizz") }), _jsxs("span", { className: "flex items-center gap-1 text-[10px] text-slate-500", children: [_jsx("span", { className: `h-1.5 w-1.5 rounded-full ${socketReady ? "bg-mint" : "bg-slate-600"}` }), "ChatQuizz"] })] }), _jsxs("button", { type: "button", onClick: () => setMobileUserMenuOpen((v) => !v), className: "flex items-center gap-1.5 rounded-xl border border-white/10 px-2 py-1.5 text-sm text-slate-200 transition hover:bg-white/5", children: [user?.avatar ? (_jsx("img", { src: user.avatar, alt: "", className: "h-5 w-5 rounded-full object-cover" })) : (_jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full bg-sky/20 text-xs font-bold text-sky", children: user?.username?.[0]?.toUpperCase() })), _jsx("span", { className: "text-slate-400", children: "\u2261" })] })] }), mobileUserMenuOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "lg:hidden fixed inset-0 z-40", onClick: () => setMobileUserMenuOpen(false) }), _jsxs("div", { className: "lg:hidden fixed right-4 top-16 z-50 min-w-[200px] rounded-2xl border border-white/10 bg-panel/95 p-3 shadow-xl backdrop-blur", children: [_jsxs("div", { className: "mb-3 flex items-center gap-2 border-b border-white/10 pb-3", children: [user?.avatar ? (_jsx("img", { src: user.avatar, alt: "", className: "h-8 w-8 rounded-full object-cover" })) : (_jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-sky/20 text-sm font-bold text-sky", children: user?.username?.[0]?.toUpperCase() })), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-white", children: user?.username }), isGuest ? (_jsx("span", { className: "text-xs text-slate-500", children: "Invit\u00E9" })) : (_jsx("span", { className: "text-xs text-slate-400", children: user?.role }))] })] }), !isGuest && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "mb-2 flex cursor-pointer items-center justify-between rounded-xl px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5", children: [_jsx("span", { children: "Couleur" }), _jsx("input", { type: "color", value: color, onChange: (e) => handleColorChange(e.target.value), className: "h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" })] }), _jsx("button", { type: "button", onClick: () => { setShowProfile(true); setMobileUserMenuOpen(false); }, className: "mb-1 w-full rounded-xl px-2 py-1.5 text-left text-sm text-slate-300 transition hover:bg-white/5", children: "Mon profil" })] })), isAdmin && (_jsx("button", { type: "button", onClick: () => { setShowAdminPanel(true); setMobileUserMenuOpen(false); }, className: "mb-1 w-full rounded-xl px-2 py-1.5 text-left text-sm text-sky transition hover:bg-sky/10", children: "Panel Admin" })), _jsx("button", { type: "button", onClick: () => { logout().catch(() => undefined); setMobileUserMenuOpen(false); }, className: "w-full rounded-xl px-2 py-1.5 text-left text-sm text-coral transition hover:bg-coral/10", children: "D\u00E9connexion" })] })] })), _jsxs("header", { className: "hidden lg:flex flex-shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "font-display text-2xl text-white", children: "ChatQuizz" }), _jsx("span", { className: `h-2 w-2 rounded-full ${socketReady ? "bg-mint" : "bg-slate-600"}`, title: socketReady ? "Connecté" : "Connexion..." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { type: "button", onClick: () => !isGuest && setShowProfile(true), className: `flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition ${isGuest ? "cursor-default opacity-70" : "hover:bg-white/5"}`, children: [user?.avatar ? (_jsx("img", { src: user.avatar, alt: "", className: "h-5 w-5 rounded-full object-cover" })) : (_jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full bg-sky/20 text-xs font-bold text-sky", children: user?.username?.[0]?.toUpperCase() })), user?.username, isGuest ? (_jsx("span", { className: "ml-0.5 rounded-full bg-slate-600/40 px-1.5 py-0.5 text-xs text-slate-400", children: "invit\u00E9" })) : (_jsx("span", { className: "ml-0.5 rounded-full bg-sky/20 px-1.5 py-0.5 text-xs text-sky", children: user?.role }))] }), !isGuest && (_jsxs("label", { className: "flex cursor-pointer items-center gap-1.5", title: "Couleur de police", children: [_jsx("span", { className: "text-xs text-slate-400", children: "Couleur" }), _jsx("input", { type: "color", value: color, onChange: (e) => handleColorChange(e.target.value), className: "h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" })] })), isAdmin && (_jsx("button", { type: "button", onClick: () => setShowAdminPanel(true), className: "rounded-xl border border-sky/40 bg-sky/10 px-3 py-2 text-sm text-sky transition hover:bg-sky/20", children: "Panel Admin" }))] }), _jsx("button", { type: "button", onClick: () => logout().catch(() => undefined), className: "rounded-xl border border-coral/40 bg-coral/20 px-4 py-2 text-sm text-coral transition hover:bg-coral/30", children: "D\u00E9connexion" })] }), mobileDrawerOpen && (_jsxs("div", { className: "lg:hidden fixed inset-0 z-50 flex", children: [_jsx("div", { className: "absolute inset-0 bg-black/60", onClick: () => setMobileDrawerOpen(false) }), _jsxs("div", { className: "relative flex h-full w-72 flex-col overflow-y-auto border-r border-white/10 bg-tide/95 p-4 shadow-xl backdrop-blur", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "font-display text-base tracking-wide text-sky", children: "Menu" }), _jsx("button", { type: "button", onClick: () => setMobileDrawerOpen(false), className: "rounded-lg px-2 py-1 text-slate-400 transition hover:text-white", children: "\u2715" })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("button", { type: "button", onClick: () => setMobileRoomsExpanded((v) => !v), className: "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-sky transition hover:bg-sky/10", children: [_jsx("span", { children: "Salons" }), _jsx("span", { className: "text-xs", children: mobileRoomsExpanded ? "▾" : "▸" })] }), mobileRoomsExpanded && (_jsx("div", { className: "mt-1 space-y-1 pl-2", children: rooms.map((room) => {
                                                    const count = roomCounts[room.id];
                                                    const isActive = !dmMode && room.id === activeRoomId;
                                                    return (_jsxs("button", { type: "button", onClick: () => handleMobileRoomSelect(room.id), className: `flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${isActive ? "bg-coral text-white" : "bg-panel/70 text-slate-200 hover:bg-panel"}`, children: [_jsxs("span", { children: [_jsx("span", { className: "mr-1.5 text-slate-400", children: ROOM_ICON[room.type] ?? "#" }), room.name] }), count !== undefined && count > 0 && (_jsx("span", { className: `rounded-full px-1.5 py-0.5 text-xs font-semibold ${isActive ? "bg-white/20 text-white" : "bg-sky/20 text-sky"}`, children: count }))] }, room.id));
                                                }) }))] }), _jsxs("div", { className: "mb-3", children: [_jsxs("button", { type: "button", onClick: () => setMobileUsersExpanded((v) => !v), className: "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-sky transition hover:bg-sky/10", children: [_jsxs("span", { children: ["Connect\u00E9s ", _jsxs("span", { className: "text-slate-400 font-normal", children: ["(", connectedUsers.length, ")"] })] }), _jsx("span", { className: "text-xs", children: mobileUsersExpanded ? "▾" : "▸" })] }), mobileUsersExpanded && (_jsx("div", { className: "mt-1 space-y-1 pl-2", children: connectedUsers.length === 0 ? (_jsx("p", { className: "px-3 text-xs text-slate-500", children: "Aucun utilisateur" })) : (connectedUsers.map((u) => (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-ink/70 px-3 py-1.5", children: [_jsx("span", { className: `h-2 w-2 flex-shrink-0 rounded-full ${ROLE_DOT[u.role] ?? "bg-mint"}` }), _jsx("span", { className: "flex-1 truncate text-sm text-slate-200", children: u.username }), u.role === "admin" && _jsx("span", { className: "text-xs font-semibold text-coral", children: "ADM" }), u.role === "moderator" && _jsx("span", { className: "text-xs font-semibold text-sky", children: "MOD" })] }, u.id)))) }))] }), !isGuest && (_jsx("div", { className: "border-t border-white/10 pt-3", children: _jsxs("button", { type: "button", onClick: handleMobileDm, className: `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${dmMode ? "bg-sky/20 text-sky" : "bg-panel/70 text-slate-200 hover:bg-panel"}`, children: [_jsx("span", { children: "\uD83D\uDCAC" }), _jsx("span", { className: "flex-1 text-left font-medium", children: "Messages priv\u00E9s" }), totalUnread > 0 && (_jsx("span", { className: "rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white", children: totalUnread > 99 ? "99+" : totalUnread }))] }) }))] })] })), _jsxs("div", { className: "grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr_20rem]", children: [_jsx("div", { className: "hidden lg:block", children: _jsx(Sidebar, { rooms: rooms, activeRoomId: activeRoomId, userRole: user?.role ?? "user", roomCounts: roomCounts, dmMode: dmMode, totalUnread: totalUnread, isGuest: isGuest, onSelectRoom: handleRoomSelect, onRoomCreated: handleRoomCreated, onMessagesClick: () => setDmMode(true) }) }), dmMode && !isGuest ? (_jsxs(_Fragment, { children: [_jsx("div", { className: !activeDmUserId ? "hidden lg:flex lg:h-full" : "flex h-full flex-col", children: activeDmUserId && activeDmUsername ? (_jsx(DmConversationPanel, { recipientId: activeDmUserId, recipientUsername: activeDmUsername })) : (_jsx("div", { className: "flex h-full items-center justify-center rounded-2xl border border-white/10 bg-panel/70", children: _jsx("p", { className: "text-sm text-slate-400", children: "\u2190 S\u00E9lectionne une conversation dans la liste" }) })) }), _jsx("div", { className: activeDmUserId ? "hidden lg:block" : "block h-full", children: _jsx(DmContactList, {}) })] })) : (_jsxs(_Fragment, { children: [_jsx(ChatPanel, { roomId: activeRoomId, messages: messages, typingUsers: typingUsers, currentUserId: user?.id, onQuizClick: !isGuest ? () => setMobileQuizOpen(true) : undefined, onDmUser: !isGuest ? handleOpenDm : undefined }), _jsxs("div", { className: "hidden lg:flex h-full min-h-0 flex-col gap-4", children: [isAdmin ? (_jsx("div", { className: "min-h-0 flex-1", children: _jsx(QuizPanel, { roomId: activeRoomId, leaderboard: leaderboard, canManageQuiz: true }) })) : !isGuest ? (_jsx(QuizSuggestWidget, { roomId: activeRoomId })) : null, _jsx("div", { className: "min-h-0 flex-1", children: _jsx(ConnectedUsers, { users: connectedUsers, currentUserId: user?.id, isGuest: isGuest, roomId: activeRoomId ?? undefined, onDmUser: handleOpenDm }) })] })] }))] })] }), mobileQuizOpen && (_jsx("div", { className: "lg:hidden fixed inset-0 z-50 flex items-end bg-black/60", children: _jsxs("div", { className: "w-full rounded-t-2xl border-t border-white/10 bg-panel/95 p-4 shadow-xl backdrop-blur", style: { maxHeight: "80vh", overflowY: "auto" }, children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h3", { className: "font-display text-base text-sky", children: "Questions Quiz" }), _jsx("button", { type: "button", onClick: () => setMobileQuizOpen(false), className: "rounded-lg px-2 py-1 text-slate-400 transition hover:text-white", children: "\u2715" })] }), isAdmin ? (_jsx(QuizPanel, { roomId: activeRoomId, leaderboard: leaderboard, canManageQuiz: true })) : (_jsx(QuizSuggestWidget, { roomId: activeRoomId }))] }) })), showAdminPanel && (_jsx(AdminPanel, { onClose: () => setShowAdminPanel(false), onRoomUpdated: updateRoom, onRoomDeleted: removeRoom })), showProfile && !isGuest && _jsx(ProfileModal, { onClose: () => setShowProfile(false) }), !isGuest && !user?.termsAcceptedAt && _jsx(TermsModal, { onAccepted: () => { } })] }));
}
