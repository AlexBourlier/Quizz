import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";
const DIFFICULTIES = ["easy", "medium", "hard"];
export function SuggestQuestionModal({ questionId, prefill, onClose, onSubmitted }) {
    const isCorrection = questionId !== null;
    const { addToast } = useNotificationStore();
    const [question, setQuestion] = useState(prefill?.question ?? "");
    const [answer, setAnswer] = useState("");
    const [category, setCategory] = useState(prefill?.category ?? "");
    const [difficulty, setDifficulty] = useState(prefill?.difficulty ?? "medium");
    const [saving, setSaving] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim() || !category.trim())
            return;
        setSaving(true);
        try {
            await api.post("/quiz/suggestions", {
                type: isCorrection ? "correction" : "new_question",
                questionId: isCorrection ? questionId : undefined,
                question: question.trim(),
                answer: answer.trim(),
                category: category.trim(),
                difficulty,
            });
            addToast("success", isCorrection ? "Correction envoyée à l'admin" : "Proposition envoyée à l'admin");
            onSubmitted?.();
            onClose();
        }
        catch (err) {
            const msg = err?.response?.data?.message ?? "Erreur";
            addToast("error", msg);
        }
        finally {
            setSaving(false);
        }
    };
    return createPortal(_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", children: _jsxs("div", { className: "w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "font-display text-lg text-white", children: isCorrection ? "Proposer une correction" : "Proposer une question" }), _jsx("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), isCorrection && (_jsx("div", { className: "mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300", children: "Tu proposes une correction pour la question active. L'admin v\u00E9rifiera ta suggestion." })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: isCorrection ? "Question (lecture seule)" : "Question *" }), _jsx("textarea", { value: question, onChange: (e) => setQuestion(e.target.value), readOnly: isCorrection, rows: 2, minLength: 5, maxLength: 500, required: true, placeholder: "La question du quiz...", className: `w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none resize-none focus:ring-2 focus:ring-sky ${isCorrection ? "opacity-60 cursor-default" : ""}` })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "R\u00E9ponse propos\u00E9e *" }), _jsx("input", { value: answer, onChange: (e) => setAnswer(e.target.value), minLength: 1, maxLength: 255, required: true, placeholder: isCorrection ? "La réponse correcte selon toi..." : "La bonne réponse...", className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Cat\u00E9gorie *" }), _jsx("input", { value: category, onChange: (e) => setCategory(e.target.value), minLength: 2, maxLength: 64, required: true, placeholder: "ex: G\u00E9ographie", className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Difficult\u00E9 *" }), _jsx("select", { value: difficulty, onChange: (e) => setDifficulty(e.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky", children: DIFFICULTIES.map((d) => (_jsx("option", { value: d, children: d === "easy" ? "Facile" : d === "medium" ? "Moyen" : "Difficile" }, d))) })] })] }), _jsxs("div", { className: "flex gap-3 pt-1", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300 transition hover:bg-white/5", children: "Annuler" }), _jsx("button", { type: "submit", disabled: saving, className: "flex-1 rounded-xl bg-sky py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50", children: saving ? "Envoi..." : "Envoyer" })] })] })] }) }), document.body);
}
