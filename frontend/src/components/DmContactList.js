import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { getSocket } from "../sockets/chat.socket";
import { useContactStore } from "../store/contact.store";
import { useDmStore } from "../store/dm.store";
import { useNotificationStore } from "../store/notification.store";
export function DmContactList() {
    const contacts = useContactStore((s) => s.contacts);
    const incomingReqs = useContactStore((s) => s.incomingRequests);
    const addContact = useContactStore((s) => s.addContact);
    const removeIncoming = useContactStore((s) => s.removeIncomingRequest);
    const activeDmUserId = useDmStore((s) => s.activeDmUserId);
    const openDm = useDmStore((s) => s.openDm);
    const unreadCounts = useDmStore((s) => s.unreadCounts);
    const { addToast } = useNotificationStore();
    const handleAccept = (request) => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("contact:accept", { requestId: request.id }, (res) => {
            if (res.ok) {
                removeIncoming(request.id);
                addContact({ id: request.sender.id, username: request.sender.username, color: request.sender.color });
                addToast("success", `${request.sender.username} ajouté à vos contacts`);
            }
            else {
                addToast("error", res.message ?? "Erreur");
            }
        });
    };
    const handleReject = (request) => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("contact:reject", { requestId: request.id }, (res) => {
            if (res.ok) {
                removeIncoming(request.id);
            }
            else {
                addToast("error", res.message ?? "Erreur");
            }
        });
    };
    return (_jsxs("aside", { className: "flex h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4", children: [incomingReqs.length > 0 && (_jsxs("div", { className: "mb-1", children: [_jsxs("h4", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400", children: ["Demandes re\u00E7ues (", incomingReqs.length, ")"] }), _jsx("div", { className: "space-y-1.5", children: incomingReqs.map((req) => (_jsxs("div", { className: "flex items-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2", children: [_jsx("span", { className: "flex-1 truncate text-sm font-medium text-slate-200", children: req.sender.username }), _jsx("button", { type: "button", onClick: () => handleAccept(req), title: "Accepter", className: "rounded-lg bg-mint/20 px-2 py-0.5 text-xs font-semibold text-mint transition hover:bg-mint/30", children: "\u2713" }), _jsx("button", { type: "button", onClick: () => handleReject(req), title: "Refuser", className: "rounded-lg bg-coral/20 px-2 py-0.5 text-xs font-semibold text-coral transition hover:bg-coral/30", children: "\u2715" })] }, req.id))) }), _jsx("div", { className: "my-3 border-t border-white/10" })] })), _jsx("h3", { className: "font-display text-lg text-sky", children: "Conversations" }), contacts.length === 0 ? (_jsxs("p", { className: "text-xs text-slate-500", children: ["Aucun contact pour le moment.", " ", _jsx("span", { className: "text-slate-600", children: "Ajoutez des contacts via la liste des connect\u00E9s." })] })) : (_jsx("div", { className: "space-y-1.5", children: contacts.map((contact) => {
                    const unread = unreadCounts[contact.id] ?? 0;
                    const isActive = activeDmUserId === contact.id;
                    return (_jsxs("button", { type: "button", onClick: () => openDm(contact.id, contact.username), className: `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${isActive ? "bg-sky/20 text-sky" : "bg-panel/70 text-slate-200 hover:bg-panel"}`, children: [_jsx("span", { className: "h-2 w-2 flex-shrink-0 rounded-full bg-mint" }), _jsx("span", { className: "flex-1 truncate font-medium", children: contact.username }), unread > 0 && (_jsx("span", { className: "rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white", children: unread > 99 ? "99+" : unread }))] }, contact.id));
                }) }))] }));
}
