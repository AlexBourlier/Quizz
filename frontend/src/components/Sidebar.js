import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { CreateRoomModal } from "./CreateRoomModal";
const TYPE_ICON = {
    public: "#",
    private: "🔒",
    restricted: "🔑",
};
export function Sidebar({ rooms, activeRoomId, userRole, roomCounts, dmMode, totalUnread, onSelectRoom, onRoomCreated, onMessagesClick, }) {
    const [showCreate, setShowCreate] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsxs("aside", { className: "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-tide/80 p-4", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("h2", { className: "font-display text-lg tracking-wide text-sky", children: "Salons" }), userRole === "admin" && (_jsx("button", { type: "button", onClick: () => setShowCreate(true), className: "rounded-lg bg-mint/20 px-2 py-0.5 text-xs font-semibold text-mint transition hover:bg-mint/30", children: "+ Cr\u00E9er" }))] }), _jsx("div", { className: "min-h-0 flex-1 space-y-2 overflow-y-auto", children: rooms.map((room) => {
                            const count = roomCounts[room.id];
                            const isActive = !dmMode && room.id === activeRoomId;
                            return (_jsxs("button", { type: "button", onClick: () => onSelectRoom(room.id), className: `w-full rounded-xl px-3 py-2 text-left text-sm transition ${isActive
                                    ? "bg-coral text-white"
                                    : "bg-panel/70 text-slate-200 hover:bg-panel"}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: [_jsx("span", { className: "mr-1.5 text-slate-400", children: TYPE_ICON[room.type] ?? "#" }), room.name] }), count !== undefined && count > 0 && (_jsx("span", { className: `rounded-full px-1.5 py-0.5 text-xs font-semibold ${isActive ? "bg-white/20 text-white" : "bg-sky/20 text-sky"}`, children: count }))] }), room.rules && (_jsx("p", { className: "mt-0.5 truncate text-xs text-slate-400", children: room.rules })), _jsxs("div", { className: "mt-0.5 flex gap-2 text-xs text-slate-500", children: [_jsx("span", { className: "capitalize", children: room.type }), room.ageLimit && _jsxs("span", { children: ["+", room.ageLimit, " ans"] }), room.maxOccupants && _jsxs("span", { children: ["max ", room.maxOccupants] })] })] }, room.id));
                        }) }), _jsx("div", { className: "mt-3 border-t border-white/10 pt-3", children: _jsxs("button", { type: "button", onClick: onMessagesClick, className: `flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${dmMode
                                ? "bg-sky/20 text-sky"
                                : "bg-panel/70 text-slate-200 hover:bg-panel"}`, children: [_jsx("span", { children: "\uD83D\uDCAC" }), _jsx("span", { className: "flex-1 text-left font-medium", children: "Messages priv\u00E9s" }), totalUnread > 0 && (_jsx("span", { className: "rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white", children: totalUnread > 99 ? "99+" : totalUnread }))] }) })] }), showCreate && (_jsx(CreateRoomModal, { onCreated: (room) => { onRoomCreated(room); setShowCreate(false); }, onClose: () => setShowCreate(false) }))] }));
}
