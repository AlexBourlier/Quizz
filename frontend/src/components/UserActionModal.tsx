import { useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useContactStore } from "../store/contact.store";
import { useNotificationStore } from "../store/notification.store";
import { ReportModal } from "./ReportModal";

type Props = {
  userId: string;
  username: string;
  userRole: string;
  roomId?: string;
  messageContent?: string;
  messageAt?: string;
  onClose: () => void;
  onDm?: () => void;
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  admin:     { label: "ADM", className: "bg-coral/20 text-coral" },
  moderator: { label: "MOD", className: "bg-sky/20 text-sky" },
};

export function UserActionModal({ userId, username, userRole, roomId, messageContent, messageAt, onClose, onDm }: Props) {
  const currentUserId  = useAuthStore((s) => s.user?.id);
  const currentRole    = useAuthStore((s) => s.user?.role);
  const isGuest        = useAuthStore((s) => s.user?.isGuest);
  const termsAccepted  = useAuthStore((s) => !!s.user?.termsAcceptedAt);

  const contacts             = useContactStore((s) => s.contacts);
  const sentPendingIds       = useContactStore((s) => s.sentPendingIds);
  const incomingReqs         = useContactStore((s) => s.incomingRequests);
  const blockedUsers         = useContactStore((s) => s.blockedUsers);
  const addSentPendingId     = useContactStore((s) => s.addSentPendingId);
  const addBlockedUser       = useContactStore((s) => s.addBlockedUser);
  const removeBlockedUser    = useContactStore((s) => s.removeBlockedUser);
  const removeContact        = useContactStore((s) => s.removeContact);
  const removeSentPendingId  = useContactStore((s) => s.removeSentPendingId);
  const removeIncomingRequest = useContactStore((s) => s.removeIncomingRequest);
  const { addToast } = useNotificationStore();

  const [showReport, setShowReport]   = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [cmdFeedback, setCmdFeedback]  = useState<string | null>(null);

  const isBlocked       = blockedUsers.some((b) => b.blockedId === userId);
  const isContact       = contacts.some((c) => c.id === userId);
  const isPendingSent   = sentPendingIds.includes(userId);
  const isPendingIncoming = incomingReqs.some((r) => r.senderId === userId);
  const canModerate     = currentRole === "admin" || currentRole === "moderator";
  const isAdmin         = userRole === "admin";

  const handleAddContact = () => {
    const socket = getSocket();
    if (!socket || !termsAccepted) return;
    socket.emit("contact:send-request", { recipientId: userId }, (res: { ok: boolean; message?: string }) => {
      if (res.ok) { addSentPendingId(userId); addToast("success", `Demande envoyée à ${username}`); }
      else addToast("error", res.message ?? "Erreur");
    });
    onClose();
  };

  const handleBlock = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("contact:block", { userId }, (res: { ok: boolean; message?: string; blockedUser?: { id: string; blockedId: string; blocked: { id: string; username: string } } }) => {
      if (res.ok && res.blockedUser) {
        addBlockedUser(res.blockedUser);
        removeContact(userId);
        removeSentPendingId(userId);
        removeIncomingRequest(incomingReqs.find((r) => r.senderId === userId)?.id ?? "");
        addToast("warning", `${username} est maintenant bloqué`);
      } else {
        addToast("error", res.message ?? "Erreur");
      }
    });
    onClose();
  };

  const handleUnblock = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("contact:unblock", { userId }, (res: { ok: boolean; message?: string }) => {
      if (res.ok) { removeBlockedUser(userId); addToast("success", `${username} est débloqué`); }
      else addToast("error", res.message ?? "Erreur");
    });
    onClose();
  };

  const handleModAction = (event: string, payload: Record<string, unknown>) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(event, payload, (res: { ok: boolean; message?: string }) => {
      if (res.ok) { addToast("success", "Action effectuée"); onClose(); }
      else { setCmdFeedback(res.message ?? "Erreur"); }
    });
  };

  if (showReport) {
    return (
      <ReportModal
        reportedId={userId}
        reportedUsername={username}
        context={messageContent ? "chat" : "user"}
        messageContent={messageContent}
        messageAt={messageAt}
        onClose={() => { setShowReport(false); onClose(); }}
      />
    );
  }

  const badge = ROLE_BADGE[userRole];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-2xl border border-white/10 bg-panel p-5 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">@{username}</span>
            {badge && (
              <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {cmdFeedback && (
          <div className="mb-3 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">{cmdFeedback}</div>
        )}

        <div className="space-y-2">
          {/* DM */}
          {!isGuest && isContact && onDm && (
            <button
              type="button"
              onClick={() => { onDm(); onClose(); }}
              className="flex w-full items-center gap-3 rounded-xl bg-sky/10 px-4 py-3 text-left text-sm font-medium text-sky transition hover:bg-sky/20"
            >
              <span className="text-lg">💬</span> Message privé
            </button>
          )}

          {/* Add contact */}
          {!isGuest && !isContact && !isPendingSent && !isPendingIncoming && !isBlocked && (
            <button
              type="button"
              onClick={handleAddContact}
              disabled={!termsAccepted}
              className="flex w-full items-center gap-3 rounded-xl bg-mint/10 px-4 py-3 text-left text-sm font-medium text-mint transition hover:bg-mint/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-lg">➕</span> Ajouter en contact
            </button>
          )}

          {isPendingSent && (
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-400">
              <span className="text-lg">⏳</span> Demande envoyée
            </div>
          )}

          {isPendingIncoming && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              <span className="text-lg">!</span> Vous a envoyé une demande de contact
            </div>
          )}

          {/* Block / Unblock */}
          {!isGuest && (
            isBlocked ? (
              <button
                type="button"
                onClick={handleUnblock}
                className="flex w-full items-center gap-3 rounded-xl bg-mint/10 px-4 py-3 text-left text-sm font-medium text-mint transition hover:bg-mint/20"
              >
                <span className="text-lg">🔓</span> Débloquer
              </button>
            ) : confirmBlock ? (
              <div className="rounded-xl border border-coral/30 bg-coral/10 p-3">
                <p className="mb-2 text-sm text-coral">Confirmer le blocage de @{username} ?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleBlock}
                    className="flex-1 rounded-lg bg-coral px-3 py-2 text-sm font-semibold text-white"
                  >
                    Bloquer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBlock(false)}
                    className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmBlock(true)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-coral/10 hover:text-coral"
              >
                <span className="text-lg">🚫</span> Bloquer
              </button>
            )
          )}

          {/* Report */}
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-coral/10 hover:text-coral"
            >
              <span className="text-lg">🚩</span> Signaler
            </button>
          )}

          {/* Mod actions */}
          {canModerate && roomId && !isAdmin && (
            <div className="mt-1 border-t border-white/10 pt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modération</p>
              <button
                type="button"
                onClick={() => handleModAction("mod:timeout", { username, roomId })}
                className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-amber-500/10 hover:text-amber-400"
              >
                <span className="text-lg">🔇</span> Timeout (10 min)
              </button>
              <button
                type="button"
                onClick={() => handleModAction("mod:kick", { username, roomId })}
                className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-amber-500/10 hover:text-amber-400"
              >
                <span className="text-lg">👢</span> Expulser du salon
              </button>
              <button
                type="button"
                onClick={() => handleModAction("mod:ban", { username })}
                className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-coral/10 hover:text-coral"
              >
                <span className="text-lg">🔨</span> Bannir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
