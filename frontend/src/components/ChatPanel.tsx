import { useState } from "react";
import { getSocket } from "../sockets/chat.socket";
import type { Message } from "../types";

type Props = {
  roomId: string | null;
  messages: Message[];
  typingUsers: string[];
};

export function ChatPanel({ roomId, messages, typingUsers }: Props) {
  const [content, setContent] = useState("");

  const sendMessage = () => {
    if (!roomId || !content.trim()) return;

    const socket = getSocket();
    socket?.emit("message:send", { roomId, content: content.trim() });
    setContent("");
  };

  return (
    <section className="flex min-h-[60vh] flex-1 flex-col rounded-2xl border border-white/10 bg-panel/70 p-4 shadow-glow">
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.map((message) => (
          <article key={message.id} className="rounded-xl border border-white/5 bg-ink/70 p-3">
            <div className="mb-1 flex items-center justify-between">
              <strong className="text-sm text-sky">{message.user.username}</strong>
              <span className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-slate-100">{message.content}</p>
          </article>
        ))}
      </div>

      <div className="mt-3 h-5 text-xs text-mint">{typingUsers.length > 0 ? `${typingUsers.join(", ")} écrit...` : ""}</div>

      <div className="mt-2 flex gap-2">
        <input
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            const socket = getSocket();
            if (!roomId || !socket) return;
            socket.emit("typing:start", { roomId });
          }}
          onBlur={() => {
            const socket = getSocket();
            if (!roomId || !socket) return;
            socket.emit("typing:stop", { roomId });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") sendMessage();
          }}
          placeholder="Écris ton message..."
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
  );
}
