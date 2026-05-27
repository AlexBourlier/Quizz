import { createPortal } from "react-dom";
import type { LeaderboardEntry } from "../types";

type Props = {
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
};

const MEDAL = ["🥇", "🥈", "🥉"];

export function LeaderboardModal({ leaderboard, onClose }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-white">🏆 Classement</h2>
          <button type="button" onClick={onClose} className="text-slate-400 transition hover:text-white">✕</button>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun score pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  i === 0 ? "border border-yellow-400/30 bg-yellow-400/10"
                  : i === 1 ? "border border-slate-400/20 bg-slate-400/10"
                  : i === 2 ? "border border-amber-600/20 bg-amber-600/10"
                  : "border border-white/5 bg-ink/60"
                }`}
              >
                <span className="w-6 text-center text-base">
                  {MEDAL[i] ?? <span className="text-sm text-slate-500">{i + 1}</span>}
                </span>
                {entry.user.avatar ? (
                  <img src={entry.user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky/20 text-xs font-bold text-sky">
                    {entry.user.username[0]?.toUpperCase()}
                  </span>
                )}
                <span className="flex-1 truncate text-sm font-medium text-slate-100">
                  {entry.user.username}
                </span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-mint">{entry.score} pts</p>
                  <p className="text-xs text-slate-500">{entry.wins} victoire{entry.wins !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-white/10 py-2 text-sm text-slate-300 transition hover:bg-white/5"
        >
          Fermer
        </button>
      </div>
    </div>,
    document.body
  );
}
