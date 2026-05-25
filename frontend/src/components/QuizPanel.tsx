import { useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useChatStore } from "../store/chat.store";
import type { LeaderboardEntry } from "../types";

type Props = {
  roomId: string | null;
  canManageQuiz: boolean;
  leaderboard: LeaderboardEntry[];
};

export function QuizPanel({ roomId, canManageQuiz, leaderboard }: Props) {
  const [answer, setAnswer] = useState("");
  const quiz = useChatStore((s) => s.quiz);
  const closeAnswer = useChatStore((s) => s.quiz.closeAnswer);

  const sendAnswer = () => {
    if (!roomId || !answer.trim()) return;
    const socket = getSocket();
    socket?.emit("quiz:answer", { roomId, answer: answer.trim() });
    setAnswer("");
  };

  const startQuiz = () => {
    if (!roomId || !canManageQuiz) return;
    getSocket()?.emit("quiz:start", { roomId });
  };

  return (
    <aside className="flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-tide/80 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-white">QuizBot</h3>
        {canManageQuiz && (
          <button
            type="button"
            onClick={startQuiz}
            className="rounded-lg bg-mint px-3 py-1 text-xs font-semibold text-ink transition hover:brightness-110"
          >
            Démarrer
          </button>
        )}
      </div>

      {quiz.lastWinner && (
        <div className="rounded-xl border border-mint/30 bg-mint/10 p-3 text-sm">
          <p className="font-semibold text-mint">Bonne réponse !</p>
          <p className="mt-1 text-slate-200">
            <span className="font-semibold text-white">{quiz.lastWinner.username}</span> a trouvé{" "}
            <span className="font-mono text-mint">{quiz.lastWinner.answer}</span> ({quiz.lastWinner.points} pts)
          </p>
        </div>
      )}

      {quiz.timeoutAnswer && (
        <div className="rounded-xl border border-coral/30 bg-coral/10 p-3 text-sm">
          <p className="font-semibold text-coral">Temps écoulé !</p>
          <p className="mt-1 text-slate-200">
            La réponse était : <span className="font-mono text-coral">{quiz.timeoutAnswer}</span>
          </p>
        </div>
      )}

      <div className="rounded-xl bg-ink/70 p-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-400">Question</p>
          {quiz.category && (
            <span className="rounded bg-sky/20 px-1.5 py-0.5 text-xs text-sky">{quiz.category}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-100">{quiz.question ?? "En attente..."}</p>
        {quiz.active && (
          <p className="mt-2 font-mono text-sm tracking-widest text-coral">
            {quiz.hint ?? ""}
          </p>
        )}
      </div>

      {closeAnswer && (
        <div className="rounded-xl border border-sky/30 bg-sky/10 px-3 py-2 text-xs text-sky">
          Presque ! Ta réponse est très proche...
        </div>
      )}

      {quiz.active && (
        <div className="flex gap-2">
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendAnswer();
            }}
            placeholder="Ta réponse"
            className="flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-sky transition focus:ring-2"
          />
          <button
            type="button"
            onClick={sendAnswer}
            className="rounded-xl bg-sky px-3 py-2 text-xs font-semibold text-ink transition hover:brightness-110"
          >
            Répondre
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Classement</p>
        {leaderboard.length === 0 ? (
          <p className="text-xs text-slate-500">Aucun score pour le moment</p>
        ) : (
          <div className="space-y-1.5">
            {leaderboard.map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg bg-ink/70 px-3 py-1.5 text-sm">
                <span className={`font-semibold ${index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-amber-600" : "text-slate-400"}`}>
                  {index + 1}.
                </span>
                <span className="ml-2 flex-1 text-slate-200">{entry.user.username}</span>
                <span className="text-mint">{entry.score} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
