import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useDmStore } from "../store/dm.store";
const EMPTY_CONTACTS = [];
export function DmContactList() {
    const contacts = useDmStore((s) => s.contacts);
    const setContacts = useDmStore((s) => s.setContacts);
    const activeDmUserId = useDmStore((s) => s.activeDmUserId);
    const openDm = useDmStore((s) => s.openDm);
    const unreadCounts = useDmStore((s) => s.unreadCounts);
    useEffect(() => {
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("dm:contacts", {}, (res) => {
            if (res.ok && res.contacts)
                setContacts(res.contacts);
        });
    }, [setContacts]);
    const list = contacts.length > 0 ? contacts : EMPTY_CONTACTS;
    return (_jsxs("aside", { className: "flex h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4", children: [_jsx("h3", { className: "font-display text-lg text-sky", children: "Conversations" }), list.length === 0 ? (_jsx("p", { className: "text-xs text-slate-500", children: "Aucune conversation pour le moment." })) : (_jsx("div", { className: "space-y-1.5", children: list.map((contact) => {
                    const unread = unreadCounts[contact.id] ?? 0;
                    const isActive = activeDmUserId === contact.id;
                    return (_jsxs("button", { type: "button", onClick: () => openDm(contact.id, contact.username), className: `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${isActive
                            ? "bg-sky/20 text-sky"
                            : "bg-panel/70 text-slate-200 hover:bg-panel"}`, children: [_jsx("span", { className: "h-2 w-2 flex-shrink-0 rounded-full bg-mint" }), _jsx("span", { className: "flex-1 truncate font-medium", children: contact.username }), unread > 0 && (_jsx("span", { className: "rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white", children: unread > 99 ? "99+" : unread }))] }, contact.id));
                }) }))] }));
}
