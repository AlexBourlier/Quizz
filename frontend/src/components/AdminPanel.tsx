import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";
import { RoomEditModal } from "./RoomEditModal";
import { RoomInviteModal } from "./RoomInviteModal";
import type { PendingAvatar, Report, Room, RoomModeratorInfo } from "../types";

type Tab = "rooms" | "moderators" | "avatars" | "reports";

type RoomWithMods = Room & { moderators: RoomModeratorInfo[] };

type Props = { onClose: () => void; onRoomUpdated: (room: Room) => void; onRoomDeleted: (roomId: string) => void };

const CONTEXT_LABEL: Record<string, string> = {
  chat: "Salon", dm: "Message privé", user: "Utilisateur"
};

export function AdminPanel({ onClose, onRoomUpdated, onRoomDeleted }: Props) {
  const [tab, setTab] = useState<Tab>("rooms");
  const [rooms, setRooms] = useState<RoomWithMods[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingAvatars, setPendingAvatars] = useState<PendingAvatar[]>([]);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [inviteRoom, setInviteRoom] = useState<Room | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [addModRoom, setAddModRoom] = useState<string | null>(null);
  const [addModUsername, setAddModUsername] = useState("");
  const { addToast } = useNotificationStore();

  useEffect(() => {
    api.get("/admin/rooms")
      .then(({ data }) => setRooms(data))
      .catch(() => addToast("error", "Erreur chargement salons"));
  }, [addToast]);

  useEffect(() => {
    if (tab === "reports") {
      api.get("/admin/reports?resolved=false")
        .then(({ data }) => setReports(data))
        .catch(() => addToast("error", "Erreur signalements"));
    }
    if (tab === "avatars") {
      api.get("/admin/avatars/pending")
        .then(({ data }) => setPendingAvatars(data))
        .catch(() => addToast("error", "Erreur avatars en attente"));
    }
  }, [tab, addToast]);

  const deleteRoom = async (roomId: string) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      onRoomDeleted(roomId);
      addToast("success", "Salon supprimé");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur";
      addToast("error", msg);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleRoomUpdated = (updated: Room) => {
    setRooms((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
    onRoomUpdated(updated);
    setEditRoom(null);
  };

  const addMod = async (roomId: string) => {
    if (!addModUsername.trim()) return;
    try {
      await api.post(`/rooms/${roomId}/moderators`, { username: addModUsername.trim() });
      const { data } = await api.get("/admin/rooms");
      setRooms(data);
      addToast("success", `${addModUsername} modérateur de ce salon`);
      setAddModUsername("");
      setAddModRoom(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur";
      addToast("error", msg);
    }
  };

  const removeMod = async (roomId: string, userId: string) => {
    try {
      await api.delete(`/rooms/${roomId}/moderators/${userId}`);
      setRooms((prev) => prev.map((r) =>
        r.id === roomId ? { ...r, moderators: r.moderators.filter((m) => m.userId !== userId) } : r
      ));
    } catch {
      addToast("error", "Erreur suppression modérateur");
    }
  };

  const approveAvatar = async (userId: string) => {
    try {
      await api.patch(`/admin/avatars/${userId}/approve`);
      setPendingAvatars((prev) => prev.filter((a) => a.id !== userId));
      addToast("success", "Avatar approuvé");
    } catch { addToast("error", "Erreur approbation"); }
  };

  const rejectAvatar = async (userId: string) => {
    try {
      await api.patch(`/admin/avatars/${userId}/reject`);
      setPendingAvatars((prev) => prev.filter((a) => a.id !== userId));
      addToast("success", "Avatar refusé");
    } catch { addToast("error", "Erreur refus"); }
  };

  const resolveReport = async (reportId: string) => {
    try {
      await api.patch(`/admin/reports/${reportId}/resolve`);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      addToast("success", "Signalement résolu");
    } catch { addToast("error", "Erreur résolution"); }
  };

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "rooms", label: "Salons" },
    { key: "moderators", label: "Modérateurs" },
    { key: "avatars", label: "Avatars", badge: pendingAvatars.length },
    { key: "reports", label: "Signalements", badge: reports.length }
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-white">Panel Admin</h2>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
            {tabs.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  tab === t.key ? "bg-sky/20 text-sky" : "text-slate-400 hover:text-white"
                }`}>
                {t.label}
                {t.badge != null && t.badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {/* ── Salons ── */}
            {tab === "rooms" && (
              <div className="space-y-3">
                {rooms.map((room) => {
                  const isProtected = ["general", "quiz-arena"].includes(room.name);
                  return (
                    <div key={room.id} className="rounded-xl border border-white/10 bg-ink/70 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">#{room.name}</p>
                          <p className="text-xs text-slate-500 capitalize">{room.type}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {!isProtected && (
                            <button type="button" onClick={() => setEditRoom(room)}
                              className="rounded-lg border border-sky/30 bg-sky/10 px-2 py-1 text-xs text-sky hover:bg-sky/20">
                              Modifier
                            </button>
                          )}
                          {room.type === "private" && (
                            <button type="button" onClick={() => setInviteRoom(room)}
                              className="rounded-lg border border-mint/30 bg-mint/10 px-2 py-1 text-xs text-mint hover:bg-mint/20">
                              Inviter
                            </button>
                          )}
                          <button type="button" onClick={() => setAddModRoom(addModRoom === room.id ? null : room.id)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5">
                            + Mod
                          </button>
                          {!isProtected && (
                            confirmDelete === room.id ? (
                              <div className="flex gap-1">
                                <button type="button" onClick={() => deleteRoom(room.id)}
                                  className="rounded-lg bg-coral px-2 py-1 text-xs text-white hover:brightness-110">
                                  Confirmer
                                </button>
                                <button type="button" onClick={() => setConfirmDelete(null)}
                                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300">
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => setConfirmDelete(room.id)}
                                className="rounded-lg border border-coral/30 bg-coral/10 px-2 py-1 text-xs text-coral hover:bg-coral/20">
                                Supprimer
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {addModRoom === room.id && (
                        <div className="mt-3 flex gap-2">
                          <input
                            value={addModUsername}
                            onChange={(e) => setAddModUsername(e.target.value)}
                            placeholder="Nom d'utilisateur..."
                            className="flex-1 rounded-lg border border-white/10 bg-panel px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-sky"
                          />
                          <button type="button" onClick={() => addMod(room.id)}
                            className="rounded-lg bg-sky/20 px-2 py-1 text-xs text-sky hover:bg-sky/30">
                            Ajouter
                          </button>
                        </div>
                      )}

                      {room.moderators.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {room.moderators.map((mod) => (
                            <span key={mod.id} className="flex items-center gap-1 rounded bg-sky/10 px-2 py-0.5 text-xs text-sky">
                              {mod.user.username}
                              <button type="button" onClick={() => removeMod(room.id, mod.userId)}
                                className="text-slate-400 hover:text-coral">
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Modérateurs globaux ── */}
            {tab === "moderators" && (
              <p className="text-sm text-slate-400">
                Les modérateurs globaux sont gérés via la commande socket <code className="text-sky">mod:promote</code>. Les modérateurs de salon sont assignés dans l'onglet "Salons".
              </p>
            )}

            {/* ── Avatars en attente ── */}
            {tab === "avatars" && (
              pendingAvatars.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun avatar en attente.</p>
              ) : (
                <div className="space-y-3">
                  {pendingAvatars.map((a) => (
                    <div key={a.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-ink/70 p-4">
                      <img src={a.pendingAvatar} alt={a.username}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400/40" />
                      <div className="flex-1">
                        <p className="font-semibold text-white">{a.username}</p>
                        {a.avatar && (
                          <p className="text-xs text-slate-500">Avatar actuel existant</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => approveAvatar(a.id)}
                          className="rounded-lg border border-mint/40 bg-mint/10 px-3 py-1 text-xs text-mint hover:bg-mint/20">
                          Approuver
                        </button>
                        <button type="button" onClick={() => rejectAvatar(a.id)}
                          className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-1 text-xs text-coral hover:bg-coral/20">
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Signalements ── */}
            {tab === "reports" && (
              reports.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun signalement en attente.</p>
              ) : (
                <div className="space-y-3">
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
                        <button type="button" onClick={() => resolveReport(report.id)}
                          className="flex-shrink-0 rounded-lg border border-mint/40 bg-mint/10 px-3 py-1 text-xs text-mint hover:bg-mint/20">
                          Résoudre
                        </button>
                      </div>
                      {report.messageContent && (
                        <p className="rounded-lg border border-white/10 bg-panel/60 px-3 py-2 text-sm text-slate-300 break-words">
                          {report.messageContent}
                        </p>
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
      </div>

      {editRoom && (
        <RoomEditModal room={editRoom} onUpdated={handleRoomUpdated} onClose={() => setEditRoom(null)} />
      )}
      {inviteRoom && (
        <RoomInviteModal room={inviteRoom} onClose={() => setInviteRoom(null)} />
      )}
    </>
  );
}
