import { useEffect, useRef, useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useChatStore } from "../store/chat.store";
import { useDmStore } from "../store/dm.store";
import { ReportModal } from "./ReportModal";
import type { DmMessage } from "../types";

const EMPTY_MESSAGES: DmMessage[] = [];
const MAX_IMAGE_PX  = 900;
const IMAGE_QUALITY = 0.75;

type Props = {
  recipientId: string;
  recipientUsername: string;
};

type ReportTarget = { userId: string; username: string; content: string; createdAt: string };

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale  = Math.min(1, MAX_IMAGE_PX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function MessageContent({ content }: { content: string }) {
  if (content.startsWith("data:image/")) {
    return (
      <img
        src={content}
        alt="photo partagée"
        className="max-w-[260px] rounded-lg object-contain"
        loading="lazy"
      />
    );
  }
  return <p className="break-words">{content}</p>;
}

export function DmConversationPanel({ recipientId, recipientUsername }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const userRole      = useAuthStore((s) => s.user?.role);
  const isAnyRoomMod  = useChatStore((s) =>
    Object.values(s.connectedUsersByRoom).some(
      (users) => users.some((u) => u.id === currentUserId && u.isRoomMod)
    )
  );
  const canSendPhoto  = userRole === "admin" || userRole === "moderator" || isAnyRoomMod;

  const messages         = useDmStore((s) => s.conversations[recipientId] ?? EMPTY_MESSAGES);
  const setDmHistory     = useDmStore((s) => s.setDmHistory);
  const clearUnread      = useDmStore((s) => s.clearUnread);
  const clearConversation = useDmStore((s) => s.clearConversation);
  const closeDm          = useDmStore((s) => s.closeDm);

  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    const socket = getSocket();
    if (!socket) { setLoading(false); return; }
    socket.emit(
      "dm:history",
      { withUserId: recipientId },
      (res: { ok: boolean; messages?: DmMessage[] }) => {
        if (res.ok && res.messages) setDmHistory(recipientId, res.messages);
        setLoading(false);
      }
    );
    clearUnread(recipientId);
  }, [recipientId, setDmHistory, clearUnread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendContent = (content: string) => {
    if (!content || sending) return;
    const socket = getSocket();
    if (!socket) return;
    setSending(true);
    socket.emit(
      "dm:send",
      { recipientUsername, content },
      (res: { ok: boolean; message?: string }) => {
        if (res.ok) setInput("");
        else setUploadError(res.message ?? "Erreur envoi");
        setSending(false);
      }
    );
  };

  const handleDelete = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("dm:delete-conversation", { withUserId: recipientId }, (res: { ok: boolean }) => {
      if (res.ok) {
        clearConversation(recipientId);
        closeDm();
      }
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Seules les images sont acceptées");
      return;
    }
    try {
      setSending(true);
      const dataUrl = await compressImage(file);
      sendContent(dataUrl);
    } catch {
      setUploadError("Impossible de traiter l'image");
      setSending(false);
    }
  };

  return (
    <>
      <section className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-panel/70 p-4 shadow-glow">
        <div className="mb-3 flex-shrink-0 border-b border-white/10 pb-3 flex items-center justify-between">
          <h3 className="font-semibold text-sky">💬 @{recipientUsername}</h3>
          {confirmDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Supprimer la discussion ?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-coral/20 px-2 py-0.5 text-xs font-semibold text-coral transition hover:bg-coral/40"
              >
                Confirmer
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-semibold text-slate-300 transition hover:bg-white/20"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              title="Supprimer la discussion"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-coral/10 hover:text-coral"
            >
              🗑
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Chargement...</p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Aucun message — lancez la conversation !
            </p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender.id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                >
                  <div className="group relative flex items-end gap-1">
                    {!isMine && hoveredMsgId === msg.id && (
                      <button
                        type="button"
                        onClick={() => setReportTarget({
                          userId:    msg.sender.id,
                          username:  msg.sender.username,
                          content:   msg.content.startsWith("data:image/") ? "[image]" : msg.content,
                          createdAt: msg.createdAt,
                        })}
                        title="Signaler ce message"
                        className="mb-1 text-[11px] text-slate-500 transition hover:text-coral"
                      >
                        🚩
                      </button>
                    )}
                    <div
                      className={`max-w-[100%] rounded-xl px-3 py-2 text-sm ${
                        isMine ? "bg-sky/20 text-sky" : "bg-ink/70 text-slate-200"
                      }`}
                    >
                      {!isMine && (
                        <p className="mb-0.5 text-[11px] font-semibold text-slate-400">
                          {msg.sender.username}
                        </p>
                      )}
                      <MessageContent content={msg.content} />
                      <p className="mt-1 text-right text-[10px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {uploadError && (
          <p className="mt-1 text-xs text-coral">{uploadError}</p>
        )}

        <div className="mt-3 flex flex-shrink-0 gap-2">
          {canSendPhoto && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <button
                type="button"
                title="Envoyer une photo"
                disabled={sending}
                onClick={() => { setUploadError(null); fileRef.current?.click(); }}
                className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-lg transition hover:bg-white/10 disabled:opacity-40"
              >
                📷
              </button>
            </>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendContent(input.trim())}
            placeholder={`Message @${recipientUsername}...`}
            className="flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-sky transition focus:ring-2"
          />
          <button
            type="button"
            onClick={() => sendContent(input.trim())}
            disabled={!input.trim() || sending}
            className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      </section>

      {reportTarget && (
        <ReportModal
          reportedId={reportTarget.userId}
          reportedUsername={reportTarget.username}
          context="dm"
          messageContent={reportTarget.content}
          messageAt={reportTarget.createdAt}
          onClose={() => setReportTarget(null)}
        />
      )}
    </>
  );
}
