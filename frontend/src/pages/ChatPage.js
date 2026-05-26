import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
const EMPTY = [];
import { AdminPanel } from "../components/AdminPanel";
import { ChatPanel } from "../components/ChatPanel";
import { ConnectedUsers } from "../components/ConnectedUsers";
import { DmContactList } from "../components/DmContactList";
import { DmConversationPanel } from "../components/DmConversationPanel";
import { ProfileModal } from "../components/ProfileModal";
import { QuizPanel } from "../components/QuizPanel";
import { Sidebar } from "../components/Sidebar";
import { useChatRealtime } from "../hooks/useChatRealtime";
import { AppLayout } from "../layouts/AppLayout";
import { api } from "../services/api";
import { connectSocket, disconnectSocket, getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useChatStore } from "../store/chat.store";
import { useDmStore } from "../store/dm.store";
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
    const totalUnread = useDmStore((s) => Object.values(s.unreadCounts).reduce((sum, n) => sum + n, 0));
    const [loadError, setLoadError] = useState(null);
    const [socketReady, setSocketReady] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [color, setColor] = useState(user?.color ?? "#a3e4d7");
    const colorDebounce = useRef(null);
    useEffect(() => {
        try {
            const socket = connectSocket();
            socket.on("connect", () => setSocketReady(true));
            socket.on("connect_error", (err) => {
                setLoadError(`Connexion socket impossible : ${err.message}`);
            });
            // When admin invites us to a room, refresh room list
            socket.on("room:invited", ({ room }) => {
                useChatStore.getState().addRoom(room);
            });
        }
        catch (err) {
            setLoadError(`Erreur socket : ${String(err)}`);
        }
        return () => {
            getSocket()?.off("room:invited");
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
    const handleOpenDm = (userId, username) => {
        openDm(userId, username);
        setDmMode(true);
    };
    if (loadError) {
        return (_jsx(AppLayout, { children: _jsx("div", { className: "flex min-h-[80vh] items-center justify-center", children: _jsxs("div", { className: "rounded-2xl border border-coral/40 bg-panel p-6 text-center", children: [_jsx("p", { className: "font-display text-lg text-coral", children: "Probl\u00E8me de connexion" }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: loadError }), _jsx("button", { type: "button", onClick: () => window.location.reload(), className: "mt-4 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white", children: "R\u00E9essayer" })] }) }) }));
    }
    return (_jsxs(AppLayout, { children: [_jsxs("div", { className: "flex h-full flex-col gap-4", children: [_jsxs("header", { className: "flex flex-shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-panel/80 px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "font-display text-2xl text-white", children: "QuizzTest" }), _jsx("span", { className: `h-2 w-2 rounded-full ${socketReady ? "bg-mint" : "bg-slate-600"}`, title: socketReady ? "Connecté" : "Connexion..." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { type: "button", onClick: () => setShowProfile(true), className: "flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/5", children: [user?.avatar ? (_jsx("img", { src: user.avatar, alt: "", className: "h-5 w-5 rounded-full object-cover" })) : (_jsx("span", { className: "flex h-5 w-5 items-center justify-center rounded-full bg-sky/20 text-xs font-bold text-sky", children: user?.username?.[0]?.toUpperCase() })), user?.username, _jsx("span", { className: "ml-0.5 rounded-full bg-sky/20 px-1.5 py-0.5 text-xs text-sky", children: user?.role })] }), _jsxs("label", { className: "flex cursor-pointer items-center gap-1.5", title: "Couleur de police", children: [_jsx("span", { className: "text-xs text-slate-400", children: "Couleur" }), _jsx("input", { type: "color", value: color, onChange: (e) => handleColorChange(e.target.value), className: "h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" })] }), user?.role === "admin" && (_jsx("button", { type: "button", onClick: () => setShowAdminPanel(true), className: "rounded-xl border border-sky/40 bg-sky/10 px-3 py-2 text-sm text-sky transition hover:bg-sky/20", children: "Panel Admin" }))] }), _jsx("button", { type: "button", onClick: () => logout().catch(() => undefined), className: "rounded-xl border border-coral/40 bg-coral/20 px-4 py-2 text-sm text-coral transition hover:bg-coral/30", children: "D\u00E9connexion" })] }), _jsxs("div", { className: "grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr_20rem]", children: [_jsx(Sidebar, { rooms: rooms, activeRoomId: activeRoomId, userRole: user?.role ?? "user", roomCounts: roomCounts, dmMode: dmMode, totalUnread: totalUnread, onSelectRoom: handleRoomSelect, onRoomCreated: handleRoomCreated, onMessagesClick: () => setDmMode(true) }), dmMode ? (_jsxs(_Fragment, { children: [activeDmUserId && activeDmUsername ? (_jsx(DmConversationPanel, { recipientId: activeDmUserId, recipientUsername: activeDmUsername })) : (_jsx("div", { className: "flex h-full items-center justify-center rounded-2xl border border-white/10 bg-panel/70", children: _jsx("p", { className: "text-sm text-slate-400", children: "\u2190 S\u00E9lectionne une conversation dans la liste" }) })), _jsx(DmContactList, {})] })) : (_jsxs(_Fragment, { children: [_jsx(ChatPanel, { roomId: activeRoomId, messages: messages, typingUsers: typingUsers, userRole: user?.role ?? "user", currentUserId: user?.id }), _jsxs("div", { className: "flex h-full min-h-0 flex-col gap-4", children: [user?.role === "admin" && (_jsx("div", { className: "min-h-0 flex-1", children: _jsx(QuizPanel, { roomId: activeRoomId, leaderboard: leaderboard, canManageQuiz: true }) })), _jsx("div", { className: "min-h-0 flex-1", children: _jsx(ConnectedUsers, { users: connectedUsers, currentUserId: user?.id, onDmUser: handleOpenDm }) })] })] }))] })] }), showAdminPanel && (_jsx(AdminPanel, { onClose: () => setShowAdminPanel(false), onRoomUpdated: updateRoom, onRoomDeleted: removeRoom })), showProfile && _jsx(ProfileModal, { onClose: () => setShowProfile(false) })] }));
}
