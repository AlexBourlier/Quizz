import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useAuthStore } from "../store/auth.store";
import { useChatStore } from "../store/chat.store";
import { useContactStore } from "../store/contact.store";
import { LeaderboardModal } from "./LeaderboardModal";
import { ReportModal } from "./ReportModal";
import { UserActionModal } from "./UserActionModal";
import type { Message } from "../types";

type Props = {
  roomId: string | null;
  messages: Message[];
  typingUsers: string[];
  currentUserId?: string;
  onQuizClick?: () => void;
  onDmUser?: (userId: string, username: string) => void;
};

const MOD_COMMANDS: Record<string, { event: string; help: string; desc: string }> = {
  ban:     { event: "mod:ban",     help: "/ban <pseudo>",            desc: "Bannir définitivement" },
  unban:   { event: "mod:unban",   help: "/unban <pseudo>",          desc: "Lever le ban" },
  timeout: { event: "mod:timeout", help: "/timeout <pseudo> [min]",  desc: "Silence temporaire (défaut 10 min)" },
  kick:    { event: "mod:kick",    help: "/kick <pseudo>",           desc: "Expulser du salon" },
  mod:     { event: "mod:promote", help: "/mod <pseudo>",            desc: "Promouvoir modérateur" },
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
type UserActionTarget = { userId: string; username: string; userRole: string; messageContent?: string; messageAt?: string };

function MessageBubble({
  message,
  currentUserId,
  isBlocked,
  onReport,
  onUserClick,
}: {
  message: Message;
  currentUserId?: string;
  isBlocked: boolean;
  onReport: (target: ReportTarget) => void;
  onUserClick: (target: UserActionTarget) => void;
}) {
  const [hovered,   setHovered]   = useState(false);
  const [revealed,  setRevealed]  = useState(false);
  const isBot  = message.user.username === "QuizBot";
  const isSelf = message.user.id === currentUserId;
  const color  = usernameColor(message.user.username, message.user.color);

  if (isBlocked && !revealed) {
    return (
      <article className="group relative rounded-xl border border-white/5 bg-ink/40 p-3">
        <div className="flex items-center justify-between">
          <strong className="text-sm text-slate-500">{message.user.username}</strong>
          <span className="text-xs text-slate-600">{new Date(message.createdAt).toLocaleTimeString()}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm italic text-slate-600">Message masqué</span>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="rounded px-1.5 py-0.5 text-[11px] text-slate-500 underline transition hover:text-slate-300"
          >
            Afficher
          </button>
        </div>
      </article>
    );
  }

  const lines = message.content.split("\n");

  return (
    <article
      className={`group relative rounded-xl border p-3 ${isBot ? "border-amber-500/30 bg-amber-950/30" : "border-white/5 bg-ink/70"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mb-1 flex items-center justify-between">
        <strong
          className={`text-sm ${!isSelf && !isBot ? "cursor-pointer hover:underline" : ""}`}
          style={color ? { color } : undefined}
          onClick={!isSelf && !isBot ? () => onUserClick({
            userId: message.user.id,
            username: message.user.username,
            userRole: message.user.role ?? "user",
            messageContent: message.content,
            messageAt: message.createdAt,
          }) : undefined}
        >
          {isBot && <span className="mr-1 text-xs font-normal text-amber-400/70">[BOT]</span>}
          {message.user.username}
          {isSelf && <span className="ml-1 text-xs font-normal text-slate-500">(vous)</span>}
          {isBlocked && revealed && (
            <span className="ml-1 text-[10px] font-normal text-slate-600">(bloqué)</span>
          )}
        </strong>
        <div className="flex items-center gap-2">
          {hovered && !isSelf && !isBot && message.user.role !== "admin" && (
            <button
              type="button"
              onClick={() => onReport({
                userId:    message.user.id,
                username:  message.user.username,
                content:   message.content,
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

const QUIZ_ARENA_NAME = "quiz-arena";

export function ChatPanel({ roomId, messages, typingUsers, currentUserId, onQuizClick, onDmUser }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const termsAccepted = useAuthStore((s) => !!s.user?.termsAcceptedAt);
  const connectedUsers = useChatStore((s) => roomId ? s.connectedUsersByRoom[roomId] : undefined);
  const isRoomMod = connectedUsers?.find((u) => u.id === currentUserId)?.isRoomMod ?? false;
  const blockedUsers = useContactStore((s) => s.blockedUsers);
  const blockedIds = useMemo(() => new Set(blockedUsers.map((b) => b.blockedId)), [blockedUsers]);
  const rooms = useChatStore((s) => s.rooms);
  const isQuizArena = roomId ? rooms.find((r) => r.id === roomId)?.name === QUIZ_ARENA_NAME : false;

  const leaderboard = useChatStore((s) => s.quiz.leaderboard);

  const [content, setContent] = useState("");
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);
  const [showCmdRef, setShowCmdRef] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [userActionTarget, setUserActionTarget] = useState<UserActionTarget | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canModerate = role === "admin" || role === "moderator" || isRoomMod;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!roomId || !content.trim()) return;
    const raw = content.trim();

    // /classement — available to all users in quiz-arena
    if (raw === "/classement" && isQuizArena) {
      setShowLeaderboard(true);
      setContent("");
      return;
    }

    // /indice — available to all users in quiz-arena
    if (raw === "/indice" && isQuizArena) {
      getSocket()?.emit("quiz:hint-request", { roomId }, (res: { ok: boolean; message?: string }) => {
        if (!res.ok) {
          setCmdFeedback(res.message ?? "Erreur");
          setTimeout(() => setCmdFeedback(null), 4000);
        }
      });
      setContent("");
      return;
    }

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
        setShowCmdRef(false);
        return;
      }
    }

    getSocket()?.emit("message:send", { roomId, content: raw });
    setContent("");
    setShowCmdRef(false);
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
              isBlocked={blockedIds.has(message.user.id)}
              onReport={setReportTarget}
              onUserClick={setUserActionTarget}
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

        {canModerate && showCmdRef && (
          <div className="mb-2 rounded-xl border border-sky/20 bg-ink/80 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky/70">Commandes de modération</p>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(MOD_COMMANDS).map(([, def]) => (
                <div key={def.event} className="flex items-baseline gap-2">
                  <code className="w-44 flex-shrink-0 text-xs text-sky">{def.help}</code>
                  <span className="text-xs text-slate-400">{def.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!termsAccepted && (
          <div className="mb-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
            Vous devez accepter la charte de bonne conduite pour écrire dans ce salon.
          </div>
        )}

        <div className="mt-1 flex gap-2">
          <input
            value={content}
            disabled={!termsAccepted}
            onChange={(e) => {
              const val = e.target.value;
              setContent(val);
              if (canModerate) setShowCmdRef(val.startsWith("/"));
              const socket = getSocket();
              if (!roomId || !socket) return;
              socket.emit("typing:start", { roomId });
            }}
            onBlur={() => {
              getSocket()?.emit("typing:stop", { roomId });
            }}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            placeholder={
              !termsAccepted ? "Acceptez la charte pour écrire…"
              : isQuizArena && canModerate ? "Message, /indice, /classement, /ban…"
              : isQuizArena ? "Message, /indice, /classement"
              : canModerate ? "Message ou /ban /timeout /kick /mod /unban"
              : "Écris ton message..."
            }
            className="flex-1 rounded-xl border border-white/10 bg-ink px-3 py-2 text-sm text-white outline-none ring-sky transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
          />
          {canModerate && (
            <button
              type="button"
              onClick={() => setShowCmdRef((v) => !v)}
              title="Commandes de modération"
              className={`rounded-xl border px-3 py-2 text-sm transition ${showCmdRef ? "border-sky/60 bg-sky/20 text-sky" : "border-white/10 text-slate-400 hover:text-white"}`}
            >
              /
            </button>
          )}
          {onQuizClick && (
            <button
              type="button"
              onClick={onQuizClick}
              title="Questions Quiz"
              className="lg:hidden rounded-xl border border-sky/30 bg-sky/10 px-3 py-2 text-sm text-sky transition hover:bg-sky/20"
            >
              🎯
            </button>
          )}
          <button
            type="button"
            onClick={sendMessage}
            disabled={!termsAccepted}
            className="rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Envoyer
          </button>
        </div>
      </section>

      {showLeaderboard && (
        <LeaderboardModal leaderboard={leaderboard} onClose={() => setShowLeaderboard(false)} />
      )}

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

      {userActionTarget && (
        <UserActionModal
          userId={userActionTarget.userId}
          username={userActionTarget.username}
          userRole={userActionTarget.userRole}
          roomId={roomId ?? undefined}
          messageContent={userActionTarget.messageContent}
          messageAt={userActionTarget.messageAt}
          onClose={() => setUserActionTarget(null)}
          onDm={onDmUser ? () => onDmUser(userActionTarget.userId, userActionTarget.username) : undefined}
        />
      )}
    </>
  );
}
