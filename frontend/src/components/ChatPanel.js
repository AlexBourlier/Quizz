import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { ReportModal } from "./ReportModal";
const MOD_COMMANDS = {
    ban: { event: "mod:ban", help: "/ban <pseudo>" },
    unban: { event: "mod:unban", help: "/unban <pseudo>" },
    timeout: { event: "mod:timeout", help: "/timeout <pseudo> [minutes]" },
    kick: { event: "mod:kick", help: "/kick <pseudo>" },
    mod: { event: "mod:promote", help: "/mod <pseudo>" },
};
function parseCommand(raw, roomId) {
    if (!raw.startsWith("/"))
        return null;
    const [cmd, ...args] = raw.slice(1).trim().split(/\s+/);
    const def = MOD_COMMANDS[cmd.toLowerCase()];
    if (!def)
        return null;
    const username = args[0];
    if (!username)
        return { error: `Usage : ${def.help}` };
    let payload = { username };
    if (cmd === "timeout")
        payload.minutes = Number(args[1]) || 10;
    if (cmd === "kick")
        payload.roomId = roomId;
    return { event: def.event, payload };
}
function usernameColor(username, userColor) {
    if (username === "QuizBot")
        return "#f9a825";
    if (userColor)
        return userColor;
    return undefined;
}
function MessageBubble({ message, currentUserId, onReport, }) {
    const [hovered, setHovered] = useState(false);
    const isBot = message.user.username === "QuizBot";
    const isSelf = message.user.id === currentUserId;
    const color = usernameColor(message.user.username, message.user.color);
    const lines = message.content.split("\n");
    return (_jsxs("article", { className: `group relative rounded-xl border p-3 ${isBot ? "border-amber-500/30 bg-amber-950/30" : "border-white/5 bg-ink/70"}`, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), children: [_jsxs("div", { className: "mb-1 flex items-center justify-between", children: [_jsxs("strong", { className: "text-sm", style: color ? { color } : undefined, children: [isBot && _jsx("span", { className: "mr-1 text-xs font-normal text-amber-400/70", children: "[BOT]" }), message.user.username, isSelf && _jsx("span", { className: "ml-1 text-xs font-normal text-slate-500", children: "(vous)" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [hovered && !isSelf && !isBot && message.user.role !== "admin" && (_jsx("button", { type: "button", onClick: () => onReport({
                                    userId: message.user.id,
                                    username: message.user.username,
                                    content: message.content,
                                    createdAt: message.createdAt,
                                }), title: "Signaler ce message", className: "text-[11px] text-slate-500 transition hover:text-coral", children: "\uD83D\uDEA9" })), _jsx("span", { className: "text-xs text-slate-500", children: new Date(message.createdAt).toLocaleTimeString() })] })] }), _jsx("div", { className: "space-y-0.5", children: lines.map((line, i) => (_jsx("p", { className: `text-sm ${isBot ? "text-amber-100/90" : "text-slate-100"}`, children: line || _jsx("br", {}) }, i))) })] }));
}
export function ChatPanel({ roomId, messages, typingUsers, userRole, currentUserId }) {
    const [content, setContent] = useState("");
    const [cmdFeedback, setCmdFeedback] = useState(null);
    const [reportTarget, setReportTarget] = useState(null);
    const bottomRef = useRef(null);
    const canModerate = userRole === "admin" || userRole === "moderator";
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const sendMessage = () => {
        if (!roomId || !content.trim())
            return;
        const raw = content.trim();
        if (raw.startsWith("/") && canModerate) {
            const result = parseCommand(raw, roomId);
            if (result) {
                if ("error" in result) {
                    setCmdFeedback(result.error ?? null);
                    setTimeout(() => setCmdFeedback(null), 3000);
                }
                else {
                    getSocket()?.emit(result.event, result.payload, (res) => {
                        setCmdFeedback(res.ok ? `Commande exécutée.` : (res.message ?? "Erreur"));
                        setTimeout(() => setCmdFeedback(null), 3000);
                    });
                }
                setContent("");
                return;
            }
        }
        getSocket()?.emit("message:send", { roomId, content: raw });
        setContent("");
    };
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-panel/70 p-4 shadow-glow", children: [_jsxs("div", { className: "flex-1 space-y-2 overflow-y-auto pr-1", children: [messages.map((message) => (_jsx(MessageBubble, { message: message, currentUserId: currentUserId, onReport: setReportTarget }, message.id))), _jsx("div", { ref: bottomRef })] }), cmdFeedback && (_jsx("div", { className: "mt-2 rounded-lg bg-sky/10 px-3 py-1.5 text-xs text-sky", children: cmdFeedback })), _jsx("div", { className: "mt-1 h-5 text-xs text-mint", children: typingUsers.length > 0 ? `${typingUsers.join(", ")} écrit...` : "" }), _jsxs("div", { className: "mt-1 flex gap-2", children: [_jsx("input", { value: content, onChange: (e) => {
                                    setContent(e.target.value);
                                    const socket = getSocket();
                                    if (!roomId || !socket)
                                        return;
                                    socket.emit("typing:start", { roomId });
                                }, onBlur: () => {
                                    getSocket()?.emit("typing:stop", { roomId });
                                }, onKeyDown: (e) => { if (e.key === "Enter")
                                    sendMessage(); }, placeholder: canModerate ? "Message ou /ban /timeout /kick /mod /unban" : "Écris ton message...", className: "flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-sky transition focus:ring-2" }), _jsx("button", { type: "button", onClick: sendMessage, className: "rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110", children: "Envoyer" })] })] }), reportTarget && (_jsx(ReportModal, { reportedId: reportTarget.userId, reportedUsername: reportTarget.username, context: "chat", messageContent: reportTarget.content, messageAt: reportTarget.createdAt, onClose: () => setReportTarget(null) }))] }));
}
