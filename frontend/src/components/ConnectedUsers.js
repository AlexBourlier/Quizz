import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
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
export function ConnectedUsers({ users, currentUserId, onDmUser }) {
    const [reportTarget, setReportTarget] = useState(null);
    return (_jsxs(_Fragment, { children: [_jsxs("aside", { className: "flex h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4", children: [_jsxs("h3", { className: "font-display text-lg text-sky", children: ["Connect\u00E9s ", _jsxs("span", { className: "ml-1 text-sm text-slate-400", children: ["(", users.length, ")"] })] }), users.length === 0 ? (_jsx("p", { className: "text-xs text-slate-500", children: "Aucun utilisateur" })) : (_jsx("div", { className: "space-y-1.5", children: users.map((user) => {
                            const isRoomMod = user.isRoomMod && user.role !== "admin" && user.role !== "moderator";
                            const badge = isRoomMod
                                ? { label: "MOD", className: "bg-sky/20 text-sky" }
                                : ROLE_BADGE[user.role];
                            const dot = user.role === "admin" ? "bg-coral"
                                : user.role === "moderator" || isRoomMod ? "bg-sky"
                                    : ROLE_DOT[user.role] ?? "bg-mint";
                            const isSelf = user.id === currentUserId;
                            return (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-ink/70 px-3 py-1.5", children: [_jsx("span", { className: `h-2 w-2 flex-shrink-0 rounded-full ${dot}` }), _jsx("span", { className: "flex-1 truncate text-sm text-slate-200", children: user.username }), badge && (_jsx("span", { className: `rounded px-1.5 py-0.5 text-xs font-semibold ${badge.className}`, children: badge.label })), isSelf ? (_jsx("span", { className: "text-xs text-slate-500", children: "vous" })) : (_jsxs("div", { className: "flex items-center gap-1", children: [onDmUser && (_jsx("button", { type: "button", onClick: () => onDmUser(user.id, user.username), title: `Message privé à ${user.username}`, className: "text-slate-500 transition hover:text-sky", children: "\u2709" })), user.role !== "admin" && (_jsx("button", { type: "button", onClick: () => setReportTarget({ id: user.id, username: user.username }), title: `Signaler ${user.username}`, className: "text-slate-500 transition hover:text-coral", children: "\uD83D\uDEA9" }))] }))] }, user.id));
                        }) }))] }), reportTarget && (_jsx(ReportModal, { reportedId: reportTarget.id, reportedUsername: reportTarget.username, context: "user", onClose: () => setReportTarget(null) }))] }));
}
