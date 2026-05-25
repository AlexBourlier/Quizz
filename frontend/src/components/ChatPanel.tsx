import { useEffect, useRef, useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { ReportModal } from "./ReportModal";
import type { Message, Role } from "../types";

type Props = {
  roomId: string | null;
  messages: Message[];
  typingUsers: string[];
  userRole: Role;
  currentUserId?: string;
};

const MOD_COMMANDS: Record<string, { event: string; help: string }> = {
  ban:     { event: "mod:ban",     help: "/ban <pseudo>" },
  unban:   { event: "mod:unban",   help: "/unban <pseudo>" },
  timeout: { event: "mod:timeout", help: "/timeout <pseudo> [minutes]" },
  kick:    { event: "mod:kick",    help: "/kick <pseudo>" },
  mod:     { event: "mod:promote", help: "/mod <pseudo>" },
};

function parseCommand(raw: string, roomId: string) {
  if (!raw.startsWith("/")) return null;
  const [cmd, ...args] = raw.slice(1).trim().split(/\s+/);
  const def = MOD_COMMANDS[cmd.toLowerCase()];
  if (!def) return null;

  const username = args[0];
  if (!username) return { error: `Usage : ${def.help}` };

  let payload: Record<string, unknown> = { username };
  if (cmd === "timeout") payload.minutes = Number(args[1]) || 10;
  if (cmd === "kick")    payload.roomId = roomId;

  return { event: def.event, payload };
}

function usernameColor(username: string, userColor?: string | null) {
  if (username === "QuizBot") return "#f9a825";
  if (userColor) return userColor;
  return undefined;
}

type ReportTarget = { userId: string; username: string; content: string; createdAt: string };

function MessageBubble({
  message,
  currentUserId,
  onReport,
}: {
  message: Message;
  currentUserId?: string;
  onReport: (target: ReportTarget) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isBot = message.user.username === "QuizBot";
  const isSelf = message.user.id === currentUserId;
  const color = usernameColor(message.user.username, message.user.color);
  const lines = message.content.split("\n");

  return (
    <article
      className={`group relative rounded-xl border p-3 ${isBot ? "border-amber-500/30 bg-amber-950/30" : "border-white/5 bg-ink/70"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mb-1 flex items-center justify-between">
        <strong className="text-sm" style={color ? { color } : undefined}>
          {isBot && <span className="mr-1 text-xs font-normal text-amber-400/70">[BOT]</span>}
          {message.user.username}
          {isSelf && <span className="ml-1 text-xs font-normal text-slate-500">(vous)</span>}
        </strong>
        <div className="flex items-center gap-2">
          {hovered && !isSelf && !isBot && message.user.role !== "admin" && (
            <button
              type="button"
              onClick={() => onReport({
                userId: message.user.id,
                username: message.user.username,
                content: message.content,
                createdAt: message.createdAt,
              })}
              title="Signaler ce message"
              className="text-[11px] text-slate-500 transition hover:text-coral"
            >
              🚩
            </button>
          )}
          <span className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleTimeString()}</span>
        </div>
      </div>
      <div className="space-y-0.5">
        {lines.map((line, i) => (
          <p key={i} className={`text-sm ${isBot ? "text-amber-100/90" : "text-slate-100"}`}>
            {line || <br />}
          </p>
        ))}
      </div>
    </article>
  );
}

export function ChatPanel({ roomId, messages, typingUsers, userRole, currentUserId }: Props) {
  const [content, setContent] = useState("");
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canModerate = userRole === "admin" || userRole === "moderator";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!roomId || !content.trim()) return;
    const raw = content.trim();

    if (raw.startsWith("/") && canModerate) {
      const result = parseCommand(raw, roomId);
      if (result) {
        if ("error" in result) {
          setCmdFeedback(result.error ?? null);
          setTimeout(() => setCmdFeedback(null), 3000);
        } else {
          getSocket()?.emit(result.event, result.payload, (res: { ok: boolean; message?: string }) => {
            setCmdFeedback(res.ok ? `Commande exécutée.` : (res.message ?? "Erreur"));
            setTimeout(() => setCmdFeedback(null), 3000);
          });
        }
        setContent("");
        return;
      }
    }

    getSocket()?.emit("message:send", { roomId, content: raw });
    setContent("");
  };

  return (
    <>
      <section className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-panel/70 p-4 shadow-glow">
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              onReport={setReportTarget}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {cmdFeedback && (
          <div className="mt-2 rounded-lg bg-sky/10 px-3 py-1.5 text-xs text-sky">
            {cmdFeedback}
          </div>
        )}

        <div className="mt-1 h-5 text-xs text-mint">
          {typingUsers.length > 0 ? `${typingUsers.join(", ")} écrit...` : ""}
        </div>

        <div className="mt-1 flex gap-2">
          <input
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              const socket = getSocket();
              if (!roomId || !socket) return;
              socket.emit("typing:start", { roomId });
            }}
            onBlur={() => {
              getSocket()?.emit("typing:stop", { roomId });
            }}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            placeholder={canModerate ? "Message ou /ban /timeout /kick /mod /unban" : "Écris ton message..."}
            className="flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-sky transition focus:ring-2"
          />
          <button
            type="button"
            onClick={sendMessage}
            className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Envoyer
          </button>
        </div>
      </section>

      {reportTarget && (
        <ReportModal
          reportedId={reportTarget.userId}
          reportedUsername={reportTarget.username}
          context="chat"
          messageContent={reportTarget.content}
          messageAt={reportTarget.createdAt}
          onClose={() => setReportTarget(null)}
        />
      )}
    </>
  );
}
