import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../services/api";
const STATUS_STYLE = {
    pending: "bg-amber-400/20 text-amber-300",
    accepted: "bg-mint/20 text-mint",
    rejected: "bg-coral/20 text-coral",
};
const STATUS_LABEL = {
    pending: "En attente",
    accepted: "Acceptée",
    rejected: "Refusée",
};
const TYPE_LABEL = {
    new_question: "Nouvelle",
    correction: "Correction",
};
const DIFF_LABEL = { easy: "Facile", medium: "Moyen", hard: "Difficile" };
export function MySuggestionsModal({ onClose }) {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get("/quiz/suggestions/mine")
            .then(({ data }) => setSuggestions(data))
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, []);
    return createPortal(_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", children: _jsxs("div", { className: "flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "font-display text-lg text-white", children: "Mes propositions" }), _jsx("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), _jsx("div", { className: "max-h-[60vh] overflow-y-auto", children: loading ? (_jsx("p", { className: "text-sm text-slate-500", children: "Chargement..." })) : suggestions.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Tu n'as pas encore propos\u00E9 de questions ou corrections." })) : (_jsx("div", { className: "space-y-3", children: suggestions.map((s) => (_jsxs("div", { className: "rounded-xl border border-white/10 bg-ink/70 p-4", children: [_jsxs("div", { className: "mb-2 flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "rounded bg-sky/20 px-1.5 py-0.5 text-xs text-sky", children: TYPE_LABEL[s.type] }), _jsx("span", { className: `rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status]}`, children: STATUS_LABEL[s.status] }), _jsx("span", { className: "ml-auto text-xs text-slate-500", children: new Date(s.createdAt).toLocaleDateString("fr-FR") })] }), s.type === "correction" && s.originalQ && (_jsxs("p", { className: "mb-1 text-xs text-slate-500", children: ["Question originale :", " ", _jsx("span", { className: "text-slate-400", children: s.originalQ.question })] })), _jsx("p", { className: "text-sm font-medium text-slate-200", children: s.question }), _jsxs("p", { className: "mt-1 text-sm text-slate-400", children: ["R\u00E9ponse propos\u00E9e : ", _jsx("span", { className: "font-mono text-mint", children: s.answer })] }), _jsxs("p", { className: "mt-0.5 text-xs text-slate-500", children: [s.category, " \u00B7 ", DIFF_LABEL[s.difficulty] ?? s.difficulty] }), s.adminComment && (_jsx("div", { className: "mt-2 rounded-lg border border-sky/20 bg-sky/10 px-3 py-2", children: _jsxs("p", { className: "text-xs text-slate-400", children: [_jsx("span", { className: "font-semibold text-sky", children: "Commentaire admin :" }), " ", s.adminComment] }) }))] }, s.id))) })) })] }) }), document.body);
}
