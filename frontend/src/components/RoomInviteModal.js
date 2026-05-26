import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";
export function RoomInviteModal({ room, onClose }) {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const { addToast } = useNotificationStore();
    useEffect(() => {
        api.get("/admin/users")
            .then(({ data }) => setUsers(data))
            .catch(() => addToast("error", "Erreur chargement utilisateurs"));
    }, [addToast]);
    const filtered = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));
    const invite = async (username) => {
        setLoading(true);
        try {
            await api.post(`/rooms/${room.id}/invite`, { username });
            addToast("success", `${username} invité dans #${room.name}`);
        }
        catch (err) {
            const msg = err?.response?.data?.message ?? "Erreur";
            addToast("error", msg);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", children: _jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("h2", { className: "font-display text-lg text-white", children: ["Inviter dans ", _jsxs("span", { className: "text-sky", children: ["#", room.name] })] }), _jsx("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Rechercher un utilisateur...", className: "mb-3 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky" }), _jsx("div", { className: "max-h-64 space-y-1.5 overflow-y-auto", children: filtered.length === 0 ? (_jsx("p", { className: "text-center text-xs text-slate-500 py-4", children: "Aucun utilisateur trouv\u00E9" })) : (filtered.map((u) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg bg-ink/70 px-3 py-2", children: [_jsx("span", { className: "text-sm text-slate-200", children: u.username }), _jsx("button", { type: "button", disabled: loading, onClick: () => invite(u.username), className: "rounded-lg bg-sky/20 px-2 py-0.5 text-xs text-sky transition hover:bg-sky/30 disabled:opacity-50", children: "Inviter" })] }, u.id)))) }), _jsx("button", { type: "button", onClick: onClose, className: "mt-4 w-full rounded-xl border border-white/10 py-2 text-sm text-slate-300 hover:bg-white/5", children: "Fermer" })] }) }));
}
