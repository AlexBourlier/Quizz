import { useState } from "react";
import { api } from "../services/api";

type Props = {
  reportedId: string;
  reportedUsername: string;
  context: "chat" | "dm" | "user";
  messageContent?: string;
  messageAt?: string;
  onClose: () => void;
};

export function ReportModal({ reportedId, reportedUsername, context, messageContent, messageAt, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (submitting) return;
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center">
            <p className="text-lg font-semibold text-mint">Signalement envoyé</p>
            <p className="mt-2 text-sm text-slate-400">Les modérateurs examineront votre signalement.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-coral">Signaler @{reportedUsername}</h3>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {messageContent && (
              <div className="mb-4 rounded-xl border border-white/10 bg-ink/60 px-3 py-2 text-sm text-slate-300">
                <p className="mb-1 text-[11px] text-slate-500">
                  Message du {messageAt ? new Date(messageAt).toLocaleString("fr-FR") : "—"}
                </p>
                <p className="break-words">{messageContent}</p>
              </div>
            )}

            <label className="mb-1 block text-sm text-slate-400">Raison (facultatif)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Décrivez le problème..."
              className="w-full resize-none rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-coral transition focus:ring-2"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Signaler"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
