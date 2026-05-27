import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useChatStore } from "../store/chat.store";
import { useDmStore } from "../store/dm.store";
import { ReportModal } from "./ReportModal";
const EMPTY_MESSAGES = [];
const MAX_IMAGE_PX = 900;
const IMAGE_QUALITY = 0.75;
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = Math.min(1, MAX_IMAGE_PX / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
        };
        img.onerror = reject;
        img.src = url;
    });
}
function MessageContent({ content }) {
    if (content.startsWith("data:image/")) {
        return (_jsx("img", { src: content, alt: "photo partag\u00E9e", className: "max-w-[260px] rounded-lg object-contain", loading: "lazy" }));
    }
    return _jsx("p", { className: "break-words", children: content });
}
export function DmConversationPanel({ recipientId, recipientUsername }) {
    const currentUserId = useAuthStore((s) => s.user?.id);
    const userRole = useAuthStore((s) => s.user?.role);
    const isAnyRoomMod = useChatStore((s) => Object.values(s.connectedUsersByRoom).some((users) => users.some((u) => u.id === currentUserId && u.isRoomMod)));
    const canSendPhoto = userRole === "admin" || userRole === "moderator" || isAnyRoomMod;
    const messages = useDmStore((s) => s.conversations[recipientId] ?? EMPTY_MESSAGES);
    const setDmHistory = useDmStore((s) => s.setDmHistory);
    const clearUnread = useDmStore((s) => s.clearUnread);
    const clearConversation = useDmStore((s) => s.clearConversation);
    const closeDm = useDmStore((s) => s.closeDm);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const [hoveredMsgId, setHoveredMsgId] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const bottomRef = useRef(null);
    const fileRef = useRef(null);
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
    const sendContent = (content) => {
        if (!content || sending)
            return;
        const socket = getSocket();
        if (!socket)
            return;
        setSending(true);
        socket.emit("dm:send", { recipientUsername, content }, (res) => {
            if (res.ok)
                setInput("");
            else
                setUploadError(res.message ?? "Erreur envoi");
            setSending(false);
        });
    };
    const handleDelete = () => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("dm:delete-conversation", { withUserId: recipientId }, (res) => {
            if (res.ok) {
                clearConversation(recipientId);
                closeDm();
            }
        });
    };
    const handlePhotoSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        e.target.value = "";
        setUploadError(null);
        if (!file.type.startsWith("image/")) {
            setUploadError("Seules les images sont acceptées");
            return;
        }
        try {
            setSending(true);
            const dataUrl = await compressImage(file);
            sendContent(dataUrl);
        }
        catch {
            setUploadError("Impossible de traiter l'image");
            setSending(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-panel/70 p-4 shadow-glow", children: [_jsxs("div", { className: "mb-3 flex-shrink-0 border-b border-white/10 pb-3 flex items-center justify-between", children: [_jsxs("h3", { className: "font-semibold text-sky", children: ["\uD83D\uDCAC @", recipientUsername] }), confirmDelete ? (_jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx("span", { className: "text-slate-400", children: "Supprimer la discussion ?" }), _jsx("button", { type: "button", onClick: handleDelete, className: "rounded-lg bg-coral/20 px-2 py-0.5 text-xs font-semibold text-coral transition hover:bg-coral/40", children: "Confirmer" }), _jsx("button", { type: "button", onClick: () => setConfirmDelete(false), className: "rounded-lg bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-300 transition hover:bg-white/20", children: "Annuler" })] })) : (_jsx("button", { type: "button", title: "Supprimer la discussion", onClick: () => setConfirmDelete(true), className: "rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-coral/10 hover:text-coral", children: "\uD83D\uDDD1" }))] }), _jsxs("div", { className: "min-h-0 flex-1 space-y-2 overflow-y-auto pr-1", children: [loading ? (_jsx("p", { className: "py-8 text-center text-sm text-slate-500", children: "Chargement..." })) : messages.length === 0 ? (_jsx("p", { className: "py-8 text-center text-sm text-slate-500", children: "Aucun message \u2014 lancez la conversation !" })) : (messages.map((msg) => {
                                const isMine = msg.sender.id === currentUserId;
                                return (_jsx("div", { className: `flex ${isMine ? "justify-end" : "justify-start"}`, onMouseEnter: () => setHoveredMsgId(msg.id), onMouseLeave: () => setHoveredMsgId(null), children: _jsxs("div", { className: "group relative flex items-end gap-1", children: [!isMine && hoveredMsgId === msg.id && (_jsx("button", { type: "button", onClick: () => setReportTarget({
                                                    userId: msg.sender.id,
                                                    username: msg.sender.username,
                                                    content: msg.content.startsWith("data:image/") ? "[image]" : msg.content,
                                                    createdAt: msg.createdAt,
                                                }), title: "Signaler ce message", className: "mb-1 text-[11px] text-slate-500 transition hover:text-coral", children: "\uD83D\uDEA9" })), _jsxs("div", { className: `max-w-[100%] rounded-xl px-3 py-2 text-sm ${isMine ? "bg-sky/20 text-sky" : "bg-ink/70 text-slate-200"}`, children: [!isMine && (_jsx("p", { className: "mb-0.5 text-[11px] font-semibold text-slate-400", children: msg.sender.username })), _jsx(MessageContent, { content: msg.content }), _jsx("p", { className: "mt-1 text-right text-[10px] text-slate-500", children: new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }) })] })] }) }, msg.id));
                            })), _jsx("div", { ref: bottomRef })] }), uploadError && (_jsx("p", { className: "mt-1 text-xs text-coral", children: uploadError })), _jsxs("div", { className: "mt-3 flex flex-shrink-0 gap-2", children: [canSendPhoto && (_jsxs(_Fragment, { children: [_jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: handlePhotoSelect }), _jsx("button", { type: "button", title: "Envoyer une photo", disabled: sending, onClick: () => { setUploadError(null); fileRef.current?.click(); }, className: "rounded-xl border border-white/10 bg-ink px-3 py-2 text-lg transition hover:bg-white/10 disabled:opacity-40", children: "\uD83D\uDCF7" })] })), _jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && !e.shiftKey && sendContent(input.trim()), placeholder: `Message @${recipientUsername}...`, className: "flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-sky transition focus:ring-2" }), _jsx("button", { type: "button", onClick: () => sendContent(input.trim()), disabled: !input.trim() || sending, className: "rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40", children: "Envoyer" })] })] }), reportTarget && (_jsx(ReportModal, { reportedId: reportTarget.userId, reportedUsername: reportTarget.username, context: "dm", messageContent: reportTarget.content, messageAt: reportTarget.createdAt, onClose: () => setReportTarget(null) }))] }));
}
