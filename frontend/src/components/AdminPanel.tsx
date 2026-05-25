import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";
import type { Report } from "../types";

type ModInfo = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  rooms: Array<{ id: string; name: string; type: string }>;
};

type Tab = "moderators" | "reports";

type Props = { onClose: () => void };

const CONTEXT_LABEL: Record<string, string> = {
  chat: "Salon",
  dm: "Message privé",
  user: "Utilisateur",
};

export function AdminPanel({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>("moderators");
  const [mods, setMods] = useState<ModInfo[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingMods, setLoadingMods] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const { addToast } = useNotificationStore();

  useEffect(() => {
    setLoadingMods(true);
    api.get("/admin/moderators")
      .then(({ data }) => setMods(data))
      .catch(() => addToast("error", "Erreur chargement modérateurs"))
      .finally(() => setLoadingMods(false));
  }, [addToast]);

  useEffect(() => {
    if (tab !== "reports") return;
    setLoadingReports(true);
    api.get("/admin/reports?resolved=false")
      .then(({ data }) => setReports(data))
      .catch(() => addToast("error", "Erreur chargement signalements"))
      .finally(() => setLoadingReports(false));
  }, [tab, addToast]);

  const demote = async (mod: ModInfo) => {
    try {
      await api.delete(`/admin/moderators/${mod.id}/demote`);
      setMods((prev) => prev.filter((m) => m.id !== mod.id));
      addToast("success", `${mod.username} rétrogradé en utilisateur`);
    } catch {
      addToast("error", "Erreur lors de la rétrogradation");
    }
  };

  const resolveReport = async (reportId: string) => {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      addToast("success", "Signalement résolu");
    } catch {
      addToast("error", "Erreur lors de la résolution");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-white">Panel Admin</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setTab("moderators")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === "moderators" ? "bg-sky/20 text-sky" : "text-slate-400 hover:text-white"
            }`}
          >
            Modérateurs
          </button>
          <button
            type="button"
            onClick={() => setTab("reports")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === "reports" ? "bg-coral/20 text-coral" : "text-slate-400 hover:text-white"
            }`}
          >
            Signalements
            {reports.length > 0 && (
              <span className="ml-1.5 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
                {reports.length}
              </span>
            )}
          </button>
        </div>

        {/* Moderators tab */}
        {tab === "moderators" && (
          loadingMods ? (
            <p className="text-sm text-slate-400">Chargement...</p>
          ) : mods.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun modérateur pour le moment.</p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {mods.map((mod) => (
                <div key={mod.id} className="rounded-xl border border-white/10 bg-ink/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sky">{mod.username}</p>
                      <p className="text-xs text-slate-400">{mod.email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Membre depuis {new Date(mod.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => demote(mod)}
                      className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-1 text-xs text-coral transition hover:bg-coral/20"
                    >
                      Rétrograder
                    </button>
                  </div>

                  {mod.rooms.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-500">Salons membres</p>
                      <div className="flex flex-wrap gap-1.5">
                        {mod.rooms.map((room) => (
                          <span key={room.id} className="rounded bg-sky/10 px-2 py-0.5 text-xs text-sky">
                            #{room.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Reports tab */}
        {tab === "reports" && (
          loadingReports ? (
            <p className="text-sm text-slate-400">Chargement...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun signalement en attente.</p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-coral/20 bg-ink/70 p-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-coral">{report.reporter.username}</span>
                        <span className="mx-1 text-slate-500">signale</span>
                        <span className="font-semibold text-sky">{report.reported.username}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {CONTEXT_LABEL[report.context] ?? report.context} —{" "}
                        {new Date(report.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => resolveReport(report.id)}
                      className="flex-shrink-0 rounded-lg border border-mint/40 bg-mint/10 px-3 py-1 text-xs text-mint transition hover:bg-mint/20"
                    >
                      Résoudre
                    </button>
                  </div>

                  {report.messageContent && (
                    <div className="rounded-lg border border-white/10 bg-panel/60 px-3 py-2 text-sm text-slate-300">
                      <p className="mb-0.5 text-[11px] text-slate-500">
                        {report.messageAt
                          ? new Date(report.messageAt).toLocaleString("fr-FR")
                          : ""}
                      </p>
                      <p className="break-words">{report.messageContent}</p>
                    </div>
                  )}

                  {report.reason && (
                    <p className="mt-2 text-xs text-slate-400">
                      <span className="font-medium text-slate-300">Raison :</span> {report.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
