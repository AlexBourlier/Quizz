import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNotificationStore } from "../store/notification.store";
import { RoomEditModal } from "./RoomEditModal";
import { RoomInviteModal } from "./RoomInviteModal";
const CONTEXT_LABEL = {
    chat: "Salon", dm: "Message privé", user: "Utilisateur"
};
export function AdminPanel({ onClose, onRoomUpdated, onRoomDeleted }) {
    const [tab, setTab] = useState("rooms");
    const [rooms, setRooms] = useState([]);
    const [reports, setReports] = useState([]);
    const [pendingAvatars, setPendingAvatars] = useState([]);
    const [editRoom, setEditRoom] = useState(null);
    const [inviteRoom, setInviteRoom] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [addModRoom, setAddModRoom] = useState(null);
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
    const deleteRoom = async (roomId) => {
        try {
            await api.delete(`/rooms/${roomId}`);
            setRooms((prev) => prev.filter((r) => r.id !== roomId));
            onRoomDeleted(roomId);
            addToast("success", "Salon supprimé");
        }
        catch (err) {
            const msg = err?.response?.data?.message ?? "Erreur";
            addToast("error", msg);
        }
        finally {
            setConfirmDelete(null);
        }
    };
    const handleRoomUpdated = (updated) => {
        setRooms((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r));
        onRoomUpdated(updated);
        setEditRoom(null);
    };
    const addMod = async (roomId) => {
        if (!addModUsername.trim())
            return;
        try {
            await api.post(`/rooms/${roomId}/moderators`, { username: addModUsername.trim() });
            const { data } = await api.get("/admin/rooms");
            setRooms(data);
            addToast("success", `${addModUsername} modérateur de ce salon`);
            setAddModUsername("");
            setAddModRoom(null);
        }
        catch (err) {
            const msg = err?.response?.data?.message ?? "Erreur";
            addToast("error", msg);
        }
    };
    const removeMod = async (roomId, userId) => {
        try {
            await api.delete(`/rooms/${roomId}/moderators/${userId}`);
            setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, moderators: r.moderators.filter((m) => m.userId !== userId) } : r));
        }
        catch {
            addToast("error", "Erreur suppression modérateur");
        }
    };
    const approveAvatar = async (userId) => {
        try {
            await api.patch(`/admin/avatars/${userId}/approve`);
            setPendingAvatars((prev) => prev.filter((a) => a.id !== userId));
            addToast("success", "Avatar approuvé");
        }
        catch {
            addToast("error", "Erreur approbation");
        }
    };
    const rejectAvatar = async (userId) => {
        try {
            await api.patch(`/admin/avatars/${userId}/reject`);
            setPendingAvatars((prev) => prev.filter((a) => a.id !== userId));
            addToast("success", "Avatar refusé");
        }
        catch {
            addToast("error", "Erreur refus");
        }
    };
    const resolveReport = async (reportId) => {
        try {
            await api.patch(`/admin/reports/${reportId}/resolve`);
            setReports((prev) => prev.filter((r) => r.id !== reportId));
            addToast("success", "Signalement résolu");
        }
        catch {
            addToast("error", "Erreur résolution");
        }
    };
    const tabs = [
        { key: "rooms", label: "Salons" },
        { key: "moderators", label: "Modérateurs" },
        { key: "avatars", label: "Avatars", badge: pendingAvatars.length },
        { key: "reports", label: "Signalements", badge: reports.length }
    ];
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4", children: _jsxs("div", { className: "flex w-full max-w-2xl flex-col gap-4 rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "font-display text-xl text-white", children: "Panel Admin" }), _jsx("button", { type: "button", onClick: onClose, className: "text-slate-400 hover:text-white", children: "\u2715" })] }), _jsx("div", { className: "flex flex-wrap gap-2 border-b border-white/10 pb-3", children: tabs.map((t) => (_jsxs("button", { type: "button", onClick: () => setTab(t.key), className: `rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === t.key ? "bg-sky/20 text-sky" : "text-slate-400 hover:text-white"}`, children: [t.label, t.badge != null && t.badge > 0 && (_jsx("span", { className: "ml-1.5 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white", children: t.badge }))] }, t.key))) }), _jsxs("div", { className: "max-h-[60vh] overflow-y-auto", children: [tab === "rooms" && (_jsx("div", { className: "space-y-3", children: rooms.map((room) => {
                                        const isProtected = ["general", "quiz-arena"].includes(room.name);
                                        return (_jsxs("div", { className: "rounded-xl border border-white/10 bg-ink/70 p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-semibold text-white", children: ["#", room.name] }), _jsx("p", { className: "text-xs text-slate-500 capitalize", children: room.type })] }), _jsxs("div", { className: "flex gap-1.5", children: [!isProtected && (_jsx("button", { type: "button", onClick: () => setEditRoom(room), className: "rounded-lg border border-sky/30 bg-sky/10 px-2 py-1 text-xs text-sky hover:bg-sky/20", children: "Modifier" })), room.type === "private" && (_jsx("button", { type: "button", onClick: () => setInviteRoom(room), className: "rounded-lg border border-mint/30 bg-mint/10 px-2 py-1 text-xs text-mint hover:bg-mint/20", children: "Inviter" })), _jsx("button", { type: "button", onClick: () => setAddModRoom(addModRoom === room.id ? null : room.id), className: "rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5", children: "+ Mod" }), !isProtected && (confirmDelete === room.id ? (_jsxs("div", { className: "flex gap-1", children: [_jsx("button", { type: "button", onClick: () => deleteRoom(room.id), className: "rounded-lg bg-coral px-2 py-1 text-xs text-white hover:brightness-110", children: "Confirmer" }), _jsx("button", { type: "button", onClick: () => setConfirmDelete(null), className: "rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300", children: "\u2715" })] })) : (_jsx("button", { type: "button", onClick: () => setConfirmDelete(room.id), className: "rounded-lg border border-coral/30 bg-coral/10 px-2 py-1 text-xs text-coral hover:bg-coral/20", children: "Supprimer" })))] })] }), addModRoom === room.id && (_jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx("input", { value: addModUsername, onChange: (e) => setAddModUsername(e.target.value), placeholder: "Nom d'utilisateur...", className: "flex-1 rounded-lg border border-white/10 bg-panel px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-sky" }), _jsx("button", { type: "button", onClick: () => addMod(room.id), className: "rounded-lg bg-sky/20 px-2 py-1 text-xs text-sky hover:bg-sky/30", children: "Ajouter" })] })), room.moderators.length > 0 && (_jsx("div", { className: "mt-2 flex flex-wrap gap-1.5", children: room.moderators.map((mod) => (_jsxs("span", { className: "flex items-center gap-1 rounded bg-sky/10 px-2 py-0.5 text-xs text-sky", children: [mod.user.username, _jsx("button", { type: "button", onClick: () => removeMod(room.id, mod.userId), className: "text-slate-400 hover:text-coral", children: "\u00D7" })] }, mod.id))) }))] }, room.id));
                                    }) })), tab === "moderators" && (_jsxs("p", { className: "text-sm text-slate-400", children: ["Les mod\u00E9rateurs globaux sont g\u00E9r\u00E9s via la commande socket ", _jsx("code", { className: "text-sky", children: "mod:promote" }), ". Les mod\u00E9rateurs de salon sont assign\u00E9s dans l'onglet \"Salons\"."] })), tab === "avatars" && (pendingAvatars.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Aucun avatar en attente." })) : (_jsx("div", { className: "space-y-3", children: pendingAvatars.map((a) => (_jsxs("div", { className: "flex items-center gap-4 rounded-xl border border-white/10 bg-ink/70 p-4", children: [_jsx("img", { src: a.pendingAvatar, alt: a.username, className: "h-16 w-16 rounded-full object-cover ring-2 ring-amber-400/40" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-white", children: a.username }), a.avatar && (_jsx("p", { className: "text-xs text-slate-500", children: "Avatar actuel existant" }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => approveAvatar(a.id), className: "rounded-lg border border-mint/40 bg-mint/10 px-3 py-1 text-xs text-mint hover:bg-mint/20", children: "Approuver" }), _jsx("button", { type: "button", onClick: () => rejectAvatar(a.id), className: "rounded-lg border border-coral/40 bg-coral/10 px-3 py-1 text-xs text-coral hover:bg-coral/20", children: "Refuser" })] })] }, a.id))) }))), tab === "reports" && (reports.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: "Aucun signalement en attente." })) : (_jsx("div", { className: "space-y-3", children: reports.map((report) => (_jsxs("div", { className: "rounded-xl border border-coral/20 bg-ink/70 p-4", children: [_jsxs("div", { className: "mb-2 flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-sm", children: [_jsx("span", { className: "font-semibold text-coral", children: report.reporter.username }), _jsx("span", { className: "mx-1 text-slate-500", children: "signale" }), _jsx("span", { className: "font-semibold text-sky", children: report.reported.username })] }), _jsxs("p", { className: "mt-0.5 text-xs text-slate-500", children: [CONTEXT_LABEL[report.context] ?? report.context, " \u2014", " ", new Date(report.createdAt).toLocaleString("fr-FR")] })] }), _jsx("button", { type: "button", onClick: () => resolveReport(report.id), className: "flex-shrink-0 rounded-lg border border-mint/40 bg-mint/10 px-3 py-1 text-xs text-mint hover:bg-mint/20", children: "R\u00E9soudre" })] }), report.messageContent && (_jsx("p", { className: "rounded-lg border border-white/10 bg-panel/60 px-3 py-2 text-sm text-slate-300 break-words", children: report.messageContent })), report.reason && (_jsxs("p", { className: "mt-2 text-xs text-slate-400", children: [_jsx("span", { className: "font-medium text-slate-300", children: "Raison :" }), " ", report.reason] }))] }, report.id))) })))] })] }) }), editRoom && (_jsx(RoomEditModal, { room: editRoom, onUpdated: handleRoomUpdated, onClose: () => setEditRoom(null) })), inviteRoom && (_jsx(RoomInviteModal, { room: inviteRoom, onClose: () => setInviteRoom(null) }))] }));
}
