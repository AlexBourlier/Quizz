import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../services/api";
export function ReportModal({ reportedId, reportedUsername, context, messageContent, messageAt, onClose }) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const submit = async () => {
        if (submitting)
            return;
        setSubmitting(true);
        try {
            await api.post("/reports", {
                reportedId,
                messageContent,
                messageAt,
                context,
                reason: reason.trim() || undefined,
            });
            setDone(true);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", onClick: onClose, children: _jsx("div", { className: "w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl", onClick: (e) => e.stopPropagation(), children: done ? (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-lg font-semibold text-mint", children: "Signalement envoy\u00E9" }), _jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Les mod\u00E9rateurs examineront votre signalement." }), _jsx("button", { type: "button", onClick: onClose, className: "mt-4 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white", children: "Fermer" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("h3", { className: "font-display text-lg text-coral", children: ["Signaler @", reportedUsername] }), _jsx("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), messageContent && (_jsxs("div", { className: "mb-4 rounded-xl border border-white/10 bg-ink/60 px-3 py-2 text-sm text-slate-300", children: [_jsxs("p", { className: "mb-1 text-[11px] text-slate-500", children: ["Message du ", messageAt ? new Date(messageAt).toLocaleString("fr-FR") : "—"] }), _jsx("p", { className: "break-words", children: messageContent })] })), _jsx("label", { className: "mb-1 block text-sm text-slate-400", children: "Raison (facultatif)" }), _jsx("textarea", { value: reason, onChange: (e) => setReason(e.target.value), rows: 3, maxLength: 500, placeholder: "D\u00E9crivez le probl\u00E8me...", className: "w-full resize-none rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-coral transition focus:ring-2" }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5", children: "Annuler" }), _jsx("button", { type: "button", onClick: submit, disabled: submitting, className: "rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50", children: submitting ? "Envoi..." : "Signaler" })] })] })) }) }));
}
