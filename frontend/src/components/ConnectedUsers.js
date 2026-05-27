import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { UserActionModal } from "./UserActionModal";
const ROLE_BADGE = {
    admin: { label: "ADM", className: "bg-coral/20 text-coral" },
    moderator: { label: "MOD", className: "bg-sky/20 text-sky" },
};
export function ConnectedUsers({ users, currentUserId, isGuest, roomId, onDmUser }) {
    const [actionTarget, setActionTarget] = useState(null);
    return (_jsxs(_Fragment, { children: [_jsxs("aside", { className: "flex h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4", children: [_jsxs("h3", { className: "font-display text-lg text-sky", children: ["Connect\u00E9s ", _jsxs("span", { className: "ml-1 text-sm text-slate-400", children: ["(", users.length, ")"] })] }), users.length === 0 ? (_jsx("p", { className: "text-xs text-slate-500", children: "Aucun utilisateur" })) : (_jsx("div", { className: "space-y-1.5", children: users.map((user) => {
                            const isRoomMod = user.isRoomMod && user.role !== "admin" && user.role !== "moderator";
                            const badge = isRoomMod
                                ? { label: "MOD", className: "bg-sky/20 text-sky" }
                                : ROLE_BADGE[user.role];
                            const dot = user.role === "admin" ? "bg-coral"
                                : user.role === "moderator" || isRoomMod ? "bg-sky"
                                    : "bg-mint";
                            const isSelf = user.id === currentUserId;
                            const clickable = !isSelf && !isGuest;
                            return (_jsxs("div", { onClick: clickable ? () => setActionTarget({ id: user.id, username: user.username, role: user.role }) : undefined, className: `flex items-center gap-2 rounded-lg bg-ink/70 px-3 py-2 ${clickable ? "cursor-pointer transition hover:bg-ink/90" : ""}`, children: [_jsx("span", { className: `h-2 w-2 flex-shrink-0 rounded-full ${dot}` }), _jsx("span", { className: "flex-1 truncate text-sm text-slate-200", children: user.username }), badge && (_jsx("span", { className: `rounded px-1.5 py-0.5 text-xs font-semibold ${badge.className}`, children: badge.label })), isSelf && _jsx("span", { className: "text-xs text-slate-500", children: "vous" })] }, user.id));
                        }) }))] }), actionTarget && (_jsx(UserActionModal, { userId: actionTarget.id, username: actionTarget.username, userRole: actionTarget.role, roomId: roomId, onClose: () => setActionTarget(null), onDm: onDmUser ? () => onDmUser(actionTarget.id, actionTarget.username) : undefined }))] }));
}
