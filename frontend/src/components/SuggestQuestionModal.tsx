import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";

type Props = {
  /** null = new question proposal; string = correction for this questionId */
  questionId: string | null;
  /** Pre-fill fields when correcting */
  prefill?: {
    question:   string;
    category:   string;
    difficulty: string;
  };
  onClose: () => void;
  onSubmitted?: () => void;
};

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export function SuggestQuestionModal({ questionId, prefill, onClose, onSubmitted }: Props) {
  const isCorrection = questionId !== null;
  const { addToast } = useNotificationStore();

  const [question,   setQuestion]   = useState(prefill?.question   ?? "");
  const [answer,     setAnswer]     = useState("");
  const [category,   setCategory]   = useState(prefill?.category   ?? "");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    (prefill?.difficulty as "easy" | "medium" | "hard") ?? "medium"
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim() || !category.trim()) return;
    setSaving(true);
    try {
      await api.post("/quiz/suggestions", {
        type:       isCorrection ? "correction" : "new_question",
        questionId: isCorrection ? questionId : undefined,
        question:   question.trim(),
        answer:     answer.trim(),
        category:   category.trim(),
        difficulty,
      });
      addToast("success", isCorrection ? "Correction envoyée à l'admin" : "Proposition envoyée à l'admin");
      onSubmitted?.();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur";
      addToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-white">
            {isCorrection ? "Proposer une correction" : "Proposer une question"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {isCorrection && (
          <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
            Tu proposes une correction pour la question active. L'admin vérifiera ta suggestion.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {isCorrection ? "Question (lecture seule)" : "Question *"}
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              readOnly={isCorrection}
              rows={2}
              minLength={5}
              maxLength={500}
              required
              placeholder="La question du quiz..."
              className={`w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none resize-none focus:ring-2 focus:ring-sky ${
                isCorrection ? "opacity-60 cursor-default" : ""
              }`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Réponse proposée *</label>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              minLength={1}
              maxLength={255}
              required
              placeholder={isCorrection ? "La réponse correcte selon toi..." : "La bonne réponse..."}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Catégorie *</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                minLength={2}
                maxLength={64}
                required
                placeholder="ex: Géographie"
                className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Difficulté *</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d === "easy" ? "Facile" : d === "medium" ? "Moyen" : "Difficile"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-sky py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
