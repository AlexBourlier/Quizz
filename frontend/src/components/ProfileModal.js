import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth.store";
import { useNotificationStore } from "../store/notification.store";
export function ProfileModal({ onClose }) {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { addToast } = useNotificationStore();
    const [username, setUsername] = useState(user?.username ?? "");
    const [preview, setPreview] = useState(user?.avatar ?? null);
    const [pendingMessage, setPendingMessage] = useState(user?.pendingAvatar ? "Avatar en attente de validation" : null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const fileRef = useRef(null);
    const resizeImage = (file) => new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const size = 128;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
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
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
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
        }
        catch {
            addToast("error", "Erreur lors de l'upload de l'avatar");
        }
        finally {
            setUploadingAvatar(false);
            if (fileRef.current)
                fileRef.current.value = "";
        }
    };
    const saveProfile = async (e) => {
        e.preventDefault();
        const trimmed = username.trim();
        if (!trimmed || trimmed === user?.username)
            return;
        setSavingProfile(true);
        try {
            await api.patch("/users/me", { username: trimmed });
            addToast("success", "Profil mis à jour");
            onClose();
        }
        catch (err) {
            const msg = err?.response?.data?.message ?? "Erreur";
            addToast("error", msg);
        }
        finally {
            setSavingProfile(false);
        }
    };
    const deleteAccount = async () => {
        try {
            await api.delete("/users/me");
            addToast("success", "Compte supprimé");
            await logout();
        }
        catch {
            addToast("error", "Erreur lors de la suppression");
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", children: _jsxs("div", { className: "w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h2", { className: "font-display text-lg text-white", children: "Mon profil" }), _jsx("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), _jsxs("div", { className: "mb-5 flex flex-col items-center gap-3", children: [_jsxs("div", { className: "relative", children: [preview ? (_jsx("img", { src: preview, alt: "avatar", className: "h-20 w-20 rounded-full object-cover ring-2 ring-sky/40" })) : (_jsx("div", { className: "flex h-20 w-20 items-center justify-center rounded-full bg-ink/80 text-3xl ring-2 ring-white/10", children: user?.username?.[0]?.toUpperCase() ?? "?" })), uploadingAvatar && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs text-white", children: "..." }))] }), _jsx("button", { type: "button", onClick: () => fileRef.current?.click(), disabled: uploadingAvatar, className: "rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-50", children: "Changer la photo" }), pendingMessage && (_jsx("p", { className: "text-center text-xs text-amber-400", children: pendingMessage })), _jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: handleFileChange })] }), _jsxs("form", { onSubmit: saveProfile, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs text-slate-400", children: "Nom d'utilisateur" }), _jsx("input", { value: username, onChange: (e) => setUsername(e.target.value), minLength: 2, maxLength: 32, className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-sky" })] }), _jsx("button", { type: "submit", disabled: savingProfile || username.trim() === user?.username, className: "w-full rounded-xl bg-sky py-2 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50", children: savingProfile ? "Enregistrement..." : "Enregistrer le profil" })] }), _jsx("div", { className: "mt-6 border-t border-white/10 pt-4", children: confirmDelete ? (_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-coral", children: "Supprimer d\u00E9finitivement votre compte ?" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: deleteAccount, className: "flex-1 rounded-xl bg-coral py-1.5 text-sm font-semibold text-white transition hover:brightness-110", children: "Confirmer" }), _jsx("button", { type: "button", onClick: () => setConfirmDelete(false), className: "flex-1 rounded-xl border border-white/10 py-1.5 text-sm text-slate-300 hover:bg-white/5", children: "Annuler" })] })] })) : (_jsx("button", { type: "button", onClick: () => setConfirmDelete(true), className: "w-full rounded-xl border border-coral/40 py-1.5 text-sm text-coral transition hover:bg-coral/10", children: "Supprimer mon compte" })) })] }) }));
}
