import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";
export function RoomEditModal({ room, onUpdated, onClose }) {
    const [name, setName] = useState(room.name);
    const [type, setType] = useState(room.type);
    const [rules, setRules] = useState(room.rules ?? "");
    const [ageLimit, setAgeLimit] = useState(room.ageLimit?.toString() ?? "");
    const [maxOccupants, setMaxOccupants] = useState(room.maxOccupants?.toString() ?? "");
    const [loading, setLoading] = useState(false);
    const { addToast } = useNotificationStore();
    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.patch(`/rooms/${room.id}`, {
                name: name.trim() || undefined,
                type,
                rules: rules.trim() || null,
                ageLimit: ageLimit ? parseInt(ageLimit, 10) : null,
                maxOccupants: maxOccupants ? parseInt(maxOccupants, 10) : null
            });
            onUpdated(data);
            addToast("success", `Salon "${data.name}" modifié`);
            onClose();
        }
        catch (err) {
            const msg = err?.response?.data?.message ?? "Erreur";
            addToast("error", msg);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", children: _jsxs("div", { className: "w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "font-display text-lg text-white", children: "Modifier le salon" }), _jsx("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), _jsxs("form", { onSubmit: submit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Nom" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Type" }), _jsxs("select", { value: type, onChange: (e) => setType(e.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none", children: [_jsx("option", { value: "public", children: "Public" }), _jsx("option", { value: "private", children: "Priv\u00E9" }), _jsx("option", { value: "restricted", children: "Restreint" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "R\u00E8gles (optionnel)" }), _jsx("textarea", { value: rules, onChange: (e) => setRules(e.target.value), rows: 3, className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky", placeholder: "R\u00E8gles du salon..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "\u00C2ge minimum" }), _jsx("input", { type: "number", min: 0, value: ageLimit, onChange: (e) => setAgeLimit(e.target.value), placeholder: "Aucun", className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Max occupants" }), _jsx("input", { type: "number", min: 1, value: maxOccupants, onChange: (e) => setMaxOccupants(e.target.value), placeholder: "Illimit\u00E9", className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky" })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5", children: "Annuler" }), _jsx("button", { type: "submit", disabled: loading, className: "rounded-xl bg-sky px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50", children: loading ? "Enregistrement..." : "Enregistrer" })] })] })] }) }));
}
