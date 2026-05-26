import { useState } from "react";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";
import type { Room } from "../types";

type Props = {
  room: Room;
  onUpdated: (room: Room) => void;
  onClose: () => void;
};

export function RoomEditModal({ room, onUpdated, onClose }: Props) {
  const [name, setName] = useState(room.name);
  const [type, setType] = useState<Room["type"]>(room.type);
  const [rules, setRules] = useState(room.rules ?? "");
  const [ageLimit, setAgeLimit] = useState(room.ageLimit?.toString() ?? "");
  const [maxOccupants, setMaxOccupants] = useState(room.maxOccupants?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotificationStore();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch(`/rooms/${room.id}`, {
        name: name.trim() || undefined,
        type,
        rules: rules.trim() || null,
        ageLimit: ageLimit ? parseInt(ageLimit, 10) : null,
        maxOccupants: maxOccupants ? parseInt(maxOccupants, 10) : null
      });
      onUpdated(data);
      addToast("success", `Salon "${data.name}" modifié`);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur";
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-white">Modifier le salon</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Room["type"])}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none"
            >
              <option value="public">Public</option>
              <option value="private">Privé</option>
              <option value="restricted">Restreint</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Règles (optionnel)</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
              placeholder="Règles du salon..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Âge minimum</label>
              <input
                type="number"
                min={0}
                value={ageLimit}
                onChange={(e) => setAgeLimit(e.target.value)}
                placeholder="Aucun"
                className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Max occupants</label>
              <input
                type="number"
                min={1}
                value={maxOccupants}
                onChange={(e) => setMaxOccupants(e.target.value)}
                placeholder="Illimité"
                className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="rounded-xl bg-sky px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50">
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
