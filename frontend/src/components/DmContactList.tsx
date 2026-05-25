import { useEffect } from "react";
import { getSocket } from "../sockets/chat.socket";
import { useDmStore } from "../store/dm.store";
import type { DmContact } from "../types";

const EMPTY_CONTACTS: DmContact[] = [];

export function DmContactList() {
  const contacts = useDmStore((s) => s.contacts);
  const setContacts = useDmStore((s) => s.setContacts);
  const activeDmUserId = useDmStore((s) => s.activeDmUserId);
  const openDm = useDmStore((s) => s.openDm);
  const unreadCounts = useDmStore((s) => s.unreadCounts);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("dm:contacts", {}, (res: { ok: boolean; contacts?: DmContact[] }) => {
      if (res.ok && res.contacts) setContacts(res.contacts);
    });
  }, [setContacts]);

  const list = contacts.length > 0 ? contacts : EMPTY_CONTACTS;

  return (
    <aside className="flex h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4">
      <h3 className="font-display text-lg text-sky">Conversations</h3>

      {list.length === 0 ? (
        <p className="text-xs text-slate-500">Aucune conversation pour le moment.</p>
      ) : (
        <div className="space-y-1.5">
          {list.map((contact) => {
            const unread = unreadCounts[contact.id] ?? 0;
            const isActive = activeDmUserId === contact.id;
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => openDm(contact.id, contact.username)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? "bg-sky/20 text-sky"
                    : "bg-panel/70 text-slate-200 hover:bg-panel"
                }`}
              >
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-mint" />
                <span className="flex-1 truncate font-medium">{contact.username}</span>
                {unread > 0 && (
                  <span className="rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
