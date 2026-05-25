import { useState } from "react";
import { api } from "../services/api";
import type { Room } from "../types";

type Props = {
  onCreated: (room: Room) => void;
  onClose: () => void;
};

export function CreateRoomModal({ onCreated, onClose }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"public" | "private" | "restricted">("public");
  const [requiredRole, setRequiredRole] = useState("");
  const [rules, setRules] = useState("");
  const [ageLimit, setAgeLimit] = useState("");
  const [maxOccupants, setMaxOccupants] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) { setError("Le nom est requis"); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/rooms", {
        name: name.trim(),
        type,
        requiredRole: type === "restricted" ? requiredRole || undefined : undefined,
        rules: rules.trim() || undefined,
        ageLimit: ageLimit ? Number(ageLimit) : undefined,
        maxOccupants: maxOccupants ? Number(maxOccupants) : undefined,
      });
      onCreated(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
        <h2 className="mb-4 font-display text-xl text-white">Nouveau salon</h2>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
              placeholder="mon-salon" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-slate-200 outline-none">
              <option value="public">Public</option>
              <option value="private">Privé</option>
              <option value="restricted">Restreint</option>
            </select>
          </div>

          {type === "restricted" && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Rôle requis</label>
              <select value={requiredRole} onChange={(e) => setRequiredRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-slate-200 outline-none">
                <option value="moderator">Modérateur</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-slate-400">Règles (optionnel)</label>
            <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={2}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
              placeholder="Règles de ce salon..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Âge minimum</label>
              <input type="number" min={0} max={99} value={ageLimit} onChange={(e) => setAgeLimit(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
                placeholder="18" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Max occupants</label>
              <input type="number" min={2} value={maxOccupants} onChange={(e) => setMaxOccupants(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
                placeholder="100" />
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-coral">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 py-2 text-sm text-slate-300 transition hover:bg-white/5">
            Annuler
          </button>
          <button type="button" onClick={submit} disabled={loading}
            className="flex-1 rounded-xl bg-mint py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50">
            {loading ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
