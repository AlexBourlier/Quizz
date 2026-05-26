import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useDmStore } from "../store/dm.store";
const EMPTY_MESSAGES = [];
export function DmPanel({ recipientId, recipientUsername, onClose }) {
    const currentUserId = useAuthStore((s) => s.user?.id);
    const messages = useDmStore((s) => s.conversations[recipientId] ?? EMPTY_MESSAGES);
    const setDmHistory = useDmStore((s) => s.setDmHistory);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    useEffect(() => {
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
    }, [recipientId, setDmHistory]);
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
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", children: _jsxs("div", { className: "flex h-[600px] max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl", children: [_jsxs("div", { className: "flex flex-shrink-0 items-center justify-between border-b border-white/10 px-4 py-3", children: [_jsxs("p", { className: "font-semibold text-sky", children: ["\uD83D\uDCAC @", recipientUsername] }), _jsx("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), _jsxs("div", { className: "min-h-0 flex-1 space-y-2 overflow-y-auto p-4", children: [loading ? (_jsx("p", { className: "text-center text-xs text-slate-500", children: "Chargement..." })) : messages.length === 0 ? (_jsx("p", { className: "text-center text-xs text-slate-500", children: "Aucun message \u2014 lancez la conversation !" })) : (messages.map((msg) => {
                            const isMine = msg.sender.id === currentUserId;
                            return (_jsx("div", { className: `flex ${isMine ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-[80%] rounded-xl px-3 py-2 text-sm ${isMine ? "bg-sky/20 text-sky" : "bg-ink/80 text-slate-200"}`, children: [!isMine && (_jsx("p", { className: "mb-0.5 text-[11px] font-semibold text-slate-400", children: msg.sender.username })), _jsx("p", { className: "break-words", children: msg.content }), _jsx("p", { className: "mt-1 text-right text-[10px] text-slate-500", children: new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }) })] }) }, msg.id));
                        })), _jsx("div", { ref: bottomRef })] }), _jsx("div", { className: "flex-shrink-0 border-t border-white/10 p-3", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && send(), placeholder: `Message @${recipientUsername}...`, className: "flex-1 rounded-lg bg-ink/60 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-sky/50" }), _jsx("button", { type: "button", onClick: send, disabled: !input.trim() || sending, className: "rounded-lg bg-sky/20 px-3 py-2 text-sky transition hover:bg-sky/30 disabled:opacity-40", children: "\u27A4" })] }) })] }) }));
}
