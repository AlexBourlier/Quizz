import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";
import type { Room } from "../types";

type UserOption = { id: string; username: string; avatar?: string | null };

type Props = {
  room: Room;
  onClose: () => void;
};

export function RoomInviteModal({ room, onClose }: Props) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotificationStore();

  useEffect(() => {
    api.get("/admin/users")
      .then(({ data }) => setUsers(data))
      .catch(() => addToast("error", "Erreur chargement utilisateurs"));
  }, [addToast]);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const invite = async (username: string) => {
    setLoading(true);
    try {
      await api.post(`/rooms/${room.id}/invite`, { username });
      addToast("success", `${username} invité dans #${room.name}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-white">
            Inviter dans <span className="text-sky">#{room.name}</span>
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="mb-3 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
        />

        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-4">Aucun utilisateur trouvé</p>
          ) : (
            filtered.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-ink/70 px-3 py-2">
                <span className="text-sm text-slate-200">{u.username}</span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => invite(u.username)}
                  className="rounded-lg bg-sky/20 px-2 py-0.5 text-xs text-sky transition hover:bg-sky/30 disabled:opacity-50"
                >
                  Inviter
                </button>
              </div>
            ))
          )}
        </div>

        <button type="button" onClick={onClose}
          className="mt-4 w-full rounded-xl border border-white/10 py-2 text-sm text-slate-300 hover:bg-white/5">
          Fermer
        </button>
      </div>
    </div>
  );
}
