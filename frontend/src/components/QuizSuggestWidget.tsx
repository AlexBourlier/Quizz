import { useState } from "react";
import { useChatStore } from "../store/chat.store";
import { MySuggestionsModal } from "./MySuggestionsModal";
import { SuggestQuestionModal } from "./SuggestQuestionModal";

type Props = { roomId: string | null };

export function QuizSuggestWidget({ roomId }: Props) {
  const [showSuggest, setShowSuggest] = useState<"new" | "correction" | null>(null);
  const [showMine, setShowMine] = useState(false);

  const quiz = useChatStore((s) => s.quiz);
  const isThisRoom = quiz.quizRoomId === roomId;
  const canCorrect = isThisRoom && quiz.active && !!quiz.questionId;

  return (
    <>
      <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-tide/80 p-4">
        <h3 className="mb-3 font-display text-sm text-sky">Questions quiz</h3>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowSuggest("new")}
            className="w-full rounded-xl border border-sky/30 bg-sky/10 px-3 py-2 text-xs font-medium text-sky transition hover:bg-sky/20"
          >
            + Proposer une question
          </button>
          {canCorrect && (
            <button
              type="button"
              onClick={() => setShowSuggest("correction")}
              className="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-400/20"
            >
              Corriger la réponse active
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowMine(true)}
            className="w-full rounded-xl border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white"
          >
            Mes propositions
          </button>
        </div>
      </div>

      {showSuggest === "new" && (
        <SuggestQuestionModal questionId={null} onClose={() => setShowSuggest(null)} />
      )}
      {showSuggest === "correction" && quiz.questionId && (
        <SuggestQuestionModal
          questionId={quiz.questionId}
          prefill={{
            question:   quiz.question ?? "",
            category:   quiz.category ?? "",
            difficulty: (quiz.difficulty ?? "medium") as "easy" | "medium" | "hard",
          }}
          onClose={() => setShowSuggest(null)}
        />
      )}
      {showMine && <MySuggestionsModal onClose={() => setShowMine(false)} />}
    </>
  );
}
