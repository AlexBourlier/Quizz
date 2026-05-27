import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useChatStore } from "../store/chat.store";
import { MySuggestionsModal } from "./MySuggestionsModal";
import { SuggestQuestionModal } from "./SuggestQuestionModal";
export function QuizSuggestWidget({ roomId }) {
    const [showSuggest, setShowSuggest] = useState(null);
    const [showMine, setShowMine] = useState(false);
    const quiz = useChatStore((s) => s.quiz);
    const isThisRoom = quiz.quizRoomId === roomId;
    const canCorrect = isThisRoom && quiz.active && !!quiz.questionId;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex-shrink-0 rounded-2xl border border-white/10 bg-tide/80 p-4", children: [_jsx("h3", { className: "mb-3 font-display text-sm text-sky", children: "Questions quiz" }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("button", { type: "button", onClick: () => setShowSuggest("new"), className: "w-full rounded-xl border border-sky/30 bg-sky/10 px-3 py-2 text-xs font-medium text-sky transition hover:bg-sky/20", children: "+ Proposer une question" }), canCorrect && (_jsx("button", { type: "button", onClick: () => setShowSuggest("correction"), className: "w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-400/20", children: "Corriger la r\u00E9ponse active" })), _jsx("button", { type: "button", onClick: () => setShowMine(true), className: "w-full rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white", children: "Mes propositions" })] })] }), showSuggest === "new" && (_jsx(SuggestQuestionModal, { questionId: null, onClose: () => setShowSuggest(null) })), showSuggest === "correction" && quiz.questionId && (_jsx(SuggestQuestionModal, { questionId: quiz.questionId, prefill: {
                    question: quiz.question ?? "",
                    category: quiz.category ?? "",
                    difficulty: (quiz.difficulty ?? "medium"),
                }, onClose: () => setShowSuggest(null) })), showMine && _jsx(MySuggestionsModal, { onClose: () => setShowMine(false) })] }));
}
