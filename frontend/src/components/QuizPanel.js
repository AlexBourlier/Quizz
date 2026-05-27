import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { getSocket } from "../sockets/chat.socket";
import { useChatStore } from "../store/chat.store";
export function QuizPanel({ roomId, canManageQuiz, leaderboard }) {
    const [answer, setAnswer] = useState("");
    const [allCategories, setAllCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showCatPicker, setShowCatPicker] = useState(false);
    const quiz = useChatStore((s) => s.quiz);
    const isThisRoom = quiz.quizRoomId === roomId;
    useEffect(() => {
        api.get("/quiz/categories")
            .then(({ data }) => setAllCategories(data))
            .catch(() => undefined);
    }, []);
    const toggleCategory = (cat) => {
        setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
    };
    const sendAnswer = () => {
        if (!roomId || !answer.trim())
            return;
        getSocket()?.emit("quiz:answer", { roomId, answer: answer.trim() });
        setAnswer("");
    };
    const startQuiz = () => {
        if (!roomId || !canManageQuiz)
            return;
        getSocket()?.emit("quiz:start", {
            roomId,
            categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        });
        setShowCatPicker(false);
    };
    const stopQuiz = () => {
        if (!roomId || !canManageQuiz)
            return;
        getSocket()?.emit("quiz:stop", { roomId });
    };
    return (_jsxs("aside", { className: "flex h-full w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-display text-xl text-white", children: "QuizBot" }), canManageQuiz && (_jsx("div", { className: "flex items-center gap-2", children: isThisRoom && quiz.active ? (_jsx("button", { type: "button", onClick: stopQuiz, className: "rounded-lg bg-coral px-3 py-1 text-xs font-semibold text-white transition hover:brightness-110", children: "Stop" })) : (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => setShowCatPicker((v) => !v), className: `rounded-lg border px-2 py-1 text-xs transition ${selectedCategories.length > 0
                                        ? "border-sky/60 bg-sky/20 text-sky"
                                        : "border-white/10 text-slate-400 hover:text-white"}`, title: "Filtrer par cat\u00E9gorie", children: selectedCategories.length > 0 ? `${selectedCategories.length} cat.` : "Catégories" }), _jsx("button", { type: "button", onClick: startQuiz, className: "rounded-lg bg-mint px-3 py-1 text-xs font-semibold text-ink transition hover:brightness-110", children: "D\u00E9marrer" })] })) }))] }), showCatPicker && canManageQuiz && (_jsxs("div", { className: "rounded-xl border border-white/10 bg-ink/70 p-3", children: [_jsx("p", { className: "mb-2 text-xs text-slate-400", children: "S\u00E9lectionne les cat\u00E9gories (vide = toutes)" }), _jsx("div", { className: "flex max-h-40 flex-wrap gap-1.5 overflow-y-auto", children: allCategories.map((cat) => (_jsx("button", { type: "button", onClick: () => toggleCategory(cat), className: `rounded px-2 py-0.5 text-xs transition ${selectedCategories.includes(cat)
                                ? "bg-sky font-semibold text-ink"
                                : "border border-white/10 bg-ink text-slate-300 hover:border-sky/40"}`, children: cat }, cat))) }), selectedCategories.length > 0 && (_jsx("button", { type: "button", onClick: () => setSelectedCategories([]), className: "mt-2 text-xs text-slate-400 hover:text-white", children: "Tout d\u00E9s\u00E9lectionner" }))] })), isThisRoom && quiz.lastWinner && (_jsxs("div", { className: "rounded-xl border border-mint/30 bg-mint/10 p-3 text-sm", children: [_jsx("p", { className: "font-semibold text-mint", children: "Bonne r\u00E9ponse !" }), _jsxs("p", { className: "mt-1 text-slate-200", children: [_jsx("span", { className: "font-semibold text-white", children: quiz.lastWinner.username }), " a trouv\u00E9", " ", _jsx("span", { className: "font-mono text-mint", children: quiz.lastWinner.answer }), " (", quiz.lastWinner.points, " pts)"] })] })), isThisRoom && quiz.timeoutAnswer && (_jsxs("div", { className: "rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm", children: [_jsx("p", { className: "font-semibold text-coral", children: "Temps \u00E9coul\u00E9 !" }), _jsxs("p", { className: "mt-1 text-slate-200", children: ["La r\u00E9ponse \u00E9tait : ", _jsx("span", { className: "font-mono text-coral", children: quiz.timeoutAnswer })] })] })), _jsxs("div", { className: "rounded-xl bg-ink/70 p-3", children: [_jsxs("div", { className: "mb-1 flex items-center justify-between", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-400", children: "Question" }), isThisRoom && quiz.category && (_jsx("span", { className: "rounded bg-sky/20 px-1.5 py-0.5 text-xs text-sky", children: quiz.category }))] }), _jsx("p", { className: "mt-1 text-sm text-slate-100", children: isThisRoom && quiz.question ? quiz.question : "En attente..." }), isThisRoom && quiz.active && (_jsx("p", { className: "mt-2 font-mono text-sm tracking-widest text-coral", children: quiz.hint ?? "" }))] }), isThisRoom && quiz.closeAnswer && (_jsx("div", { className: "rounded-xl border border-sky/30 bg-sky/10 px-3 py-2 text-xs text-sky", children: "Presque ! Ta r\u00E9ponse est tr\u00E8s proche..." })), isThisRoom && quiz.active && (_jsxs("div", { className: "flex gap-2", children: [_jsx("input", { value: answer, onChange: (e) => setAnswer(e.target.value), onKeyDown: (e) => { if (e.key === "Enter")
                            sendAnswer(); }, placeholder: "Ta r\u00E9ponse", className: "flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-sky transition focus:ring-2" }), _jsx("button", { type: "button", onClick: sendAnswer, className: "rounded-xl bg-sky px-3 py-2 text-xs font-semibold text-ink transition hover:brightness-110", children: "R\u00E9pondre" })] })), _jsxs("div", { children: [_jsx("p", { className: "mb-2 text-xs uppercase tracking-wide text-slate-400", children: "Classement" }), leaderboard.length === 0 ? (_jsx("p", { className: "text-xs text-slate-500", children: "Aucun score pour le moment" })) : (_jsx("div", { className: "space-y-1.5", children: leaderboard.map((entry, index) => (_jsxs("div", { className: "flex items-center justify-between rounded-lg bg-ink/70 px-3 py-1.5 text-sm", children: [_jsxs("span", { className: `font-semibold ${index === 0 ? "text-yellow-400"
                                        : index === 1 ? "text-slate-300"
                                            : index === 2 ? "text-amber-600"
                                                : "text-slate-400"}`, children: [index + 1, "."] }), _jsx("span", { className: "ml-2 flex-1 text-slate-200", children: entry.user.username }), _jsxs("span", { className: "text-mint", children: [entry.score, " pts"] })] }, entry.id))) }))] })] }));
}
