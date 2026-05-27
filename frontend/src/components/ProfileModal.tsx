import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useContactStore } from "../store/contact.store";
import { useNotificationStore } from "../store/notification.store";

type Props = { onClose: () => void };

export function ProfileModal({ onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const patchUser = useAuthStore((s) => s.patchUser);
  const { addToast } = useNotificationStore();

  const blockedUsers   = useContactStore((s) => s.blockedUsers);
  const removeBlocked  = useContactStore((s) => s.removeBlockedUser);

  const handleUnblock = (blockedId: string, username: string) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("contact:unblock", { userId: blockedId }, (res: { ok: boolean; message?: string }) => {
      if (res.ok) {
        removeBlocked(blockedId);
        addToast("success", `${username} est débloqué`);
      } else {
        addToast("error", res.message ?? "Erreur");
      }
    });
  };

  const [username, setUsername] = useState(user?.username ?? "");
  const [preview, setPreview] = useState<string | null>(user?.avatar ?? null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(
    user?.pendingAvatar ? "Avatar en attente de validation" : null
  );

  // Fetch fresh profile on mount to get the latest approved avatar
  useEffect(() => {
    api.get("/users/me")
      .then(({ data }) => {
        patchUser({ avatar: data.avatar, username: data.username });
        setPreview(data.avatar ?? null);
        setUsername(data.username);
        setPendingMessage(data.pendingAvatar ? "Avatar en attente de validation" : null);
      })
      .catch(() => undefined);
  }, [patchUser]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const scale = Math.max(size / img.width, size / img.height);
        const sw = size / scale;
        const sh = size / scale;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("error", "Fichier invalide, choisissez une image");
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await resizeImage(file);
      setPreview(base64);
      await api.post("/users/me/avatar", { avatar: base64 });
      setPendingMessage("Avatar envoyé — en attente de validation par l'admin");
      addToast("success", "Avatar soumis pour validation");
    } catch {
      addToast("error", "Erreur lors de l'upload de l'avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed || trimmed === user?.username) return;
    setSavingProfile(true);
    try {
      await api.patch("/users/me", { username: trimmed });
      addToast("success", "Profil mis à jour");
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur";
      addToast("error", msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete("/users/me");
      addToast("success", "Compte supprimé");
      await logout();
    } catch {
      addToast("error", "Erreur lors de la suppression");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-white">Mon profil</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Avatar */}
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="avatar"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-sky/40"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink/80 text-3xl ring-2 ring-white/10">
                {user?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs text-white">
                ...
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            Changer la photo
          </button>
          {pendingMessage && (
            <p className="text-center text-xs text-amber-400">{pendingMessage}</p>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Username */}
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Nom d'utilisateur</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={2}
              maxLength={32}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile || username.trim() === user?.username}
            className="w-full rounded-xl bg-sky py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {savingProfile ? "Enregistrement..." : "Enregistrer le profil"}
          </button>
        </form>

        {/* Blocked users */}
        {blockedUsers.length > 0 && (
          <div className="mt-5 border-t border-white/10 pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-coral/80">
              Utilisateurs bloqués ({blockedUsers.length})
            </h3>
            <div className="space-y-1.5">
              {blockedUsers.map((b) => (
                <div key={b.blockedId} className="flex items-center gap-2 rounded-lg bg-coral/10 px-3 py-1.5">
                  <span className="flex-1 truncate text-sm text-slate-300">{b.blocked.username}</span>
                  <button
                    type="button"
                    onClick={() => handleUnblock(b.blockedId, b.blocked.username)}
                    className="rounded-lg border border-white/10 px-2 py-0.5 text-xs text-slate-400 transition hover:border-mint/40 hover:text-mint"
                  >
                    Débloquer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete account */}
        <div className="mt-6 border-t border-white/10 pt-4">
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-coral">Supprimer définitivement votre compte ?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={deleteAccount}
                  className="flex-1 rounded-xl bg-coral py-1.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 rounded-xl border border-white/10 py-1.5 text-sm text-slate-300 hover:bg-white/5"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full rounded-xl border border-coral/40 py-1.5 text-sm text-coral transition hover:bg-coral/10"
            >
              Supprimer mon compte
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
