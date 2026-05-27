import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useContactStore } from "../store/contact.store";
import { useNotificationStore } from "../store/notification.store";
import { ReportModal } from "./ReportModal";
const ROLE_BADGE = {
    admin: { label: "ADM", className: "bg-coral/20 text-coral" },
    moderator: { label: "MOD", className: "bg-sky/20 text-sky" },
};
const ROLE_DOT = {
    admin: "bg-coral",
    moderator: "bg-sky",
    user: "bg-mint",
};
export function ConnectedUsers({ users, currentUserId, isGuest, onDmUser }) {
    const termsAccepted = useAuthStore((s) => !!s.user?.termsAcceptedAt);
    const [reportTarget, setReportTarget] = useState(null);
    const [blockConfirm, setBlockConfirm] = useState(null);
    const contacts = useContactStore((s) => s.contacts);
    const sentPendingIds = useContactStore((s) => s.sentPendingIds);
    const incomingReqs = useContactStore((s) => s.incomingRequests);
    const blockedUsers = useContactStore((s) => s.blockedUsers);
    const addSentPendingId = useContactStore((s) => s.addSentPendingId);
    const addBlockedUser = useContactStore((s) => s.addBlockedUser);
    const removeBlockedUser = useContactStore((s) => s.removeBlockedUser);
    const removeContact = useContactStore((s) => s.removeContact);
    const removeSentPendingId = useContactStore((s) => s.removeSentPendingId);
    const removeIncomingRequest = useContactStore((s) => s.removeIncomingRequest);
    const { addToast } = useNotificationStore();
    const getRelation = (userId) => {
        if (blockedUsers.some((b) => b.blockedId === userId))
            return "blocked";
        if (contacts.some((c) => c.id === userId))
            return "contact";
        if (sentPendingIds.includes(userId))
            return "pending-sent";
        if (incomingReqs.some((r) => r.senderId === userId))
            return "pending-received";
        return "none";
    };
    const handleSendRequest = (userId, username) => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("contact:send-request", { recipientId: userId }, (res) => {
            if (res.ok) {
                addSentPendingId(userId);
                addToast("success", `Demande envoyée à ${username}`);
            }
            else {
                addToast("error", res.message ?? "Erreur");
            }
        });
    };
    const handleBlock = (userId, username) => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("contact:block", { userId }, (res) => {
            if (res.ok && res.blockedUser) {
                addBlockedUser(res.blockedUser);
                removeContact(userId);
                removeSentPendingId(userId);
                removeIncomingRequest(incomingReqs.find((r) => r.senderId === userId)?.id ?? "");
                addToast("warning", `${username} est maintenant bloqué`);
            }
            else {
                addToast("error", res.message ?? "Erreur");
            }
            setBlockConfirm(null);
        });
    };
    const handleUnblock = (userId, username) => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("contact:unblock", { userId }, (res) => {
            if (res.ok) {
                removeBlockedUser(userId);
                addToast("success", `${username} est débloqué`);
            }
            else {
                addToast("error", res.message ?? "Erreur");
            }
        });
    };
    return (_jsxs(_Fragment, { children: [_jsxs("aside", { className: "flex h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4", children: [_jsxs("h3", { className: "font-display text-lg text-sky", children: ["Connect\u00E9s ", _jsxs("span", { className: "ml-1 text-sm text-slate-400", children: ["(", users.length, ")"] })] }), users.length === 0 ? (_jsx("p", { className: "text-xs text-slate-500", children: "Aucun utilisateur" })) : (_jsx("div", { className: "space-y-1.5", children: users.map((user) => {
                            const isRoomMod = user.isRoomMod && user.role !== "admin" && user.role !== "moderator";
                            const badge = isRoomMod
                                ? { label: "MOD", className: "bg-sky/20 text-sky" }
                                : ROLE_BADGE[user.role];
                            const dot = user.role === "admin" ? "bg-coral"
                                : user.role === "moderator" || isRoomMod ? "bg-sky"
                                    : ROLE_DOT[user.role] ?? "bg-mint";
                            const isSelf = user.id === currentUserId;
                            const rel = isSelf ? null : getRelation(user.id);
                            return (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-ink/70 px-3 py-1.5", children: [_jsx("span", { className: `h-2 w-2 flex-shrink-0 rounded-full ${dot}` }), _jsx("span", { className: "flex-1 truncate text-sm text-slate-200", children: user.username }), badge && (_jsx("span", { className: `rounded px-1.5 py-0.5 text-xs font-semibold ${badge.className}`, children: badge.label })), isSelf ? (_jsx("span", { className: "text-xs text-slate-500", children: "vous" })) : isGuest ? null : (_jsxs("div", { className: "flex items-center gap-1", children: [rel === "contact" && onDmUser && (_jsx("button", { type: "button", onClick: () => onDmUser(user.id, user.username), title: `Message privé à ${user.username}`, className: "text-slate-400 transition hover:text-sky", children: "\u2709" })), rel === "none" && (_jsx("button", { type: "button", onClick: () => termsAccepted && handleSendRequest(user.id, user.username), title: termsAccepted ? `Demande de contact à ${user.username}` : "Acceptez la charte pour contacter", className: `transition ${termsAccepted ? "text-slate-400 hover:text-mint" : "cursor-not-allowed text-slate-600"}`, children: "+" })), rel === "pending-sent" && (_jsx("span", { title: "Demande envoy\u00E9e, en attente", className: "text-xs text-slate-500", children: "\u23F3" })), rel === "pending-received" && (_jsx("span", { title: "Cet utilisateur vous a envoy\u00E9 une demande", className: "text-xs text-amber-400", children: "!" })), rel !== "blocked" ? (blockConfirm === user.id ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => handleBlock(user.id, user.username), title: "Confirmer le blocage", className: "text-xs text-coral transition hover:brightness-125", children: "\u2713" }), _jsx("button", { type: "button", onClick: () => setBlockConfirm(null), className: "text-xs text-slate-500 transition hover:text-white", children: "\u2715" })] })) : (_jsx("button", { type: "button", onClick: () => setBlockConfirm(user.id), title: `Bloquer ${user.username}`, className: "text-slate-500 transition hover:text-coral", children: "\uD83D\uDEAB" }))) : (_jsx("button", { type: "button", onClick: () => handleUnblock(user.id, user.username), title: `Débloquer ${user.username}`, className: "text-slate-500 transition hover:text-mint", children: "\uD83D\uDD13" })), user.role !== "admin" && (_jsx("button", { type: "button", onClick: () => setReportTarget({ id: user.id, username: user.username }), title: `Signaler ${user.username}`, className: "text-slate-500 transition hover:text-coral", children: "\uD83D\uDEA9" }))] }))] }, user.id));
                        }) }))] }), reportTarget && (_jsx(ReportModal, { reportedId: reportTarget.id, reportedUsername: reportTarget.username, context: "user", onClose: () => setReportTarget(null) }))] }));
}
