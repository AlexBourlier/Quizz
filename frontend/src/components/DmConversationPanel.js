import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useDmStore } from "../store/dm.store";
import { ReportModal } from "./ReportModal";
const EMPTY_MESSAGES = [];
export function DmConversationPanel({ recipientId, recipientUsername }) {
    const currentUserId = useAuthStore((s) => s.user?.id);
    const messages = useDmStore((s) => s.conversations[recipientId] ?? EMPTY_MESSAGES);
    const setDmHistory = useDmStore((s) => s.setDmHistory);
    const clearUnread = useDmStore((s) => s.clearUnread);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const [hoveredMsgId, setHoveredMsgId] = useState(null);
    const bottomRef = useRef(null);
    useEffect(() => {
        setLoading(true);
        const socket = getSocket();
        if (!socket) {
            setLoading(false);
            return;
        }
        socket.emit("dm:history", { withUserId: recipientId }, (res) => {
            if (res.ok && res.messages)
                setDmHistory(recipientId, res.messages);
            setLoading(false);
        });
        clearUnread(recipientId);
    }, [recipientId, setDmHistory, clearUnread]);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const send = () => {
        const content = input.trim();
        if (!content || sending)
            return;
        const socket = getSocket();
        if (!socket)
            return;
        setSending(true);
        socket.emit("dm:send", { recipientUsername, content }, (res) => {
            if (res.ok)
                setInput("");
            setSending(false);
        });
    };
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-panel/70 p-4 shadow-glow", children: [_jsx("div", { className: "mb-3 flex-shrink-0 border-b border-white/10 pb-3", children: _jsxs("h3", { className: "font-semibold text-sky", children: ["\uD83D\uDCAC @", recipientUsername] }) }), _jsxs("div", { className: "min-h-0 flex-1 space-y-2 overflow-y-auto pr-1", children: [loading ? (_jsx("p", { className: "py-8 text-center text-sm text-slate-500", children: "Chargement..." })) : messages.length === 0 ? (_jsx("p", { className: "py-8 text-center text-sm text-slate-500", children: "Aucun message \u2014 lancez la conversation !" })) : (messages.map((msg) => {
                                const isMine = msg.sender.id === currentUserId;
                                return (_jsx("div", { className: `flex ${isMine ? "justify-end" : "justify-start"}`, onMouseEnter: () => setHoveredMsgId(msg.id), onMouseLeave: () => setHoveredMsgId(null), children: _jsxs("div", { className: "group relative flex items-end gap-1", children: [!isMine && hoveredMsgId === msg.id && (_jsx("button", { type: "button", onClick: () => setReportTarget({
                                                    userId: msg.sender.id,
                                                    username: msg.sender.username,
                                                    content: msg.content,
                                                    createdAt: msg.createdAt,
                                                }), title: "Signaler ce message", className: "mb-1 text-[11px] text-slate-500 transition hover:text-coral", children: "\uD83D\uDEA9" })), _jsxs("div", { className: `max-w-[75%] rounded-xl px-3 py-2 text-sm ${isMine ? "bg-sky/20 text-sky" : "bg-ink/70 text-slate-200"}`, children: [!isMine && (_jsx("p", { className: "mb-0.5 text-[11px] font-semibold text-slate-400", children: msg.sender.username })), _jsx("p", { className: "break-words", children: msg.content }), _jsx("p", { className: "mt-1 text-right text-[10px] text-slate-500", children: new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }) })] })] }) }, msg.id));
                            })), _jsx("div", { ref: bottomRef })] }), _jsxs("div", { className: "mt-3 flex flex-shrink-0 gap-2", children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && send(), placeholder: `Message @${recipientUsername}...`, className: "flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-sky transition focus:ring-2" }), _jsx("button", { type: "button", onClick: send, disabled: !input.trim() || sending, className: "rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40", children: "Envoyer" })] })] }), reportTarget && (_jsx(ReportModal, { reportedId: reportTarget.userId, reportedUsername: reportTarget.username, context: "dm", messageContent: reportTarget.content, messageAt: reportTarget.createdAt, onClose: () => setReportTarget(null) }))] }));
}
