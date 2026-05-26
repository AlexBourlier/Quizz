import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../services/api";
export function CreateRoomModal({ onCreated, onClose }) {
    const [name, setName] = useState("");
    const [type, setType] = useState("public");
    const [requiredRole, setRequiredRole] = useState("");
    const [rules, setRules] = useState("");
    const [ageLimit, setAgeLimit] = useState("");
    const [maxOccupants, setMaxOccupants] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const submit = async () => {
        if (!name.trim()) {
            setError("Le nom est requis");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post("/rooms", {
                name: name.trim(),
                type,
                requiredRole: type === "restricted" ? requiredRole || undefined : undefined,
                rules: rules.trim() || undefined,
                ageLimit: ageLimit ? Number(ageLimit) : undefined,
                maxOccupants: maxOccupants ? Number(maxOccupants) : undefined,
            });
            onCreated(data);
        }
        catch (err) {
            const msg = err?.response?.data?.message;
            setError(msg ?? "Erreur lors de la création");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", children: _jsxs("div", { className: "w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl", children: [_jsx("h2", { className: "mb-4 font-display text-xl text-white", children: "Nouveau salon" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Nom" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky", placeholder: "mon-salon" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Type" }), _jsxs("select", { value: type, onChange: (e) => setType(e.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-slate-200 outline-none", children: [_jsx("option", { value: "public", children: "Public" }), _jsx("option", { value: "private", children: "Priv\u00E9" }), _jsx("option", { value: "restricted", children: "Restreint" })] })] }), type === "restricted" && (_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "R\u00F4le requis" }), _jsxs("select", { value: requiredRole, onChange: (e) => setRequiredRole(e.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-slate-200 outline-none", children: [_jsx("option", { value: "moderator", children: "Mod\u00E9rateur" }), _jsx("option", { value: "admin", children: "Admin" })] })] })), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "R\u00E8gles (optionnel)" }), _jsx("textarea", { value: rules, onChange: (e) => setRules(e.target.value), rows: 2, className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky", placeholder: "R\u00E8gles de ce salon..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "\u00C2ge minimum" }), _jsx("input", { type: "number", min: 0, max: 99, value: ageLimit, onChange: (e) => setAgeLimit(e.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky", placeholder: "18" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Max occupants" }), _jsx("input", { type: "number", min: 2, value: maxOccupants, onChange: (e) => setMaxOccupants(e.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky", placeholder: "100" })] })] })] }), error && _jsx("p", { className: "mt-3 text-sm text-coral", children: error }), _jsxs("div", { className: "mt-5 flex gap-3", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300 transition hover:bg-white/5", children: "Annuler" }), _jsx("button", { type: "button", onClick: submit, disabled: loading, className: "flex-1 rounded-xl bg-mint py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50", children: loading ? "Création..." : "Créer" })] })] }) }));
}
