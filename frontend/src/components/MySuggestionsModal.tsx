import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../services/api";
import type { QuizSuggestion } from "../types";

type Props = { onClose: () => void };

const STATUS_STYLE: Record<string, string> = {
  pending:  "bg-amber-400/20 text-amber-300",
  accepted: "bg-mint/20 text-mint",
  rejected: "bg-coral/20 text-coral",
};

const STATUS_LABEL: Record<string, string> = {
  pending:  "En attente",
  accepted: "Acceptée",
  rejected: "Refusée",
};

const TYPE_LABEL: Record<string, string> = {
  new_question: "Nouvelle",
  correction:   "Correction",
};

const DIFF_LABEL: Record<string, string> = { easy: "Facile", medium: "Moyen", hard: "Difficile" };

export function MySuggestionsModal({ onClose }: Props) {
  const [suggestions, setSuggestions] = useState<QuizSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/quiz/suggestions/mine")
      .then(({ data }) => setSuggestions(data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-white">Mes propositions</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-500">Chargement...</p>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-slate-500">
              Tu n'as pas encore proposé de questions ou corrections.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => (
                <div key={s.id} className="rounded-xl border border-white/10 bg-ink/70 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-sky/20 px-1.5 py-0.5 text-xs text-sky">
                      {TYPE_LABEL[s.type]}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                    <span className="ml-auto text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {/* For corrections: show original question */}
                  {s.type === "correction" && s.originalQ && (
                    <p className="mb-1 text-xs text-slate-500">
                      Question originale :{" "}
                      <span className="text-slate-400">{s.originalQ.question}</span>
                    </p>
                  )}

                  <p className="text-sm font-medium text-slate-200">{s.question}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Réponse proposée : <span className="font-mono text-mint">{s.answer}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {s.category} · {DIFF_LABEL[s.difficulty] ?? s.difficulty}
                  </p>

                  {s.adminComment && (
                    <div className="mt-2 rounded-lg border border-sky/20 bg-sky/10 px-3 py-2">
                      <p className="text-xs text-slate-400">
                        <span className="font-semibold text-sky">Commentaire admin :</span>{" "}
                        {s.adminComment}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
