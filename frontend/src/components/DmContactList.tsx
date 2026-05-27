import { getSocket } from "../sockets/chat.socket";
import { useContactStore } from "../store/contact.store";
import { useDmStore } from "../store/dm.store";
import { useNotificationStore } from "../store/notification.store";
import type { ContactRequest, DmContact } from "../types";

export function DmContactList() {
  const contacts        = useContactStore((s) => s.contacts);
  const incomingReqs    = useContactStore((s) => s.incomingRequests);
  const addContact      = useContactStore((s) => s.addContact);
  const removeIncoming  = useContactStore((s) => s.removeIncomingRequest);

  const activeDmUserId  = useDmStore((s) => s.activeDmUserId);
  const openDm          = useDmStore((s) => s.openDm);
  const unreadCounts    = useDmStore((s) => s.unreadCounts);
  const { addToast }    = useNotificationStore();

  const handleAccept = (request: ContactRequest) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("contact:accept", { requestId: request.id }, (res: { ok: boolean; message?: string }) => {
      if (res.ok) {
        removeIncoming(request.id);
        addContact({ id: request.sender.id, username: request.sender.username, color: request.sender.color });
        addToast("success", `${request.sender.username} ajouté à vos contacts`);
      } else {
        addToast("error", res.message ?? "Erreur");
      }
    });
  };

  const handleReject = (request: ContactRequest) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("contact:reject", { requestId: request.id }, (res: { ok: boolean; message?: string }) => {
      if (res.ok) {
        removeIncoming(request.id);
      } else {
        addToast("error", res.message ?? "Erreur");
      }
    });
  };

  return (
    <aside className="flex h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4">
      {/* Pending incoming requests */}
      {incomingReqs.length > 0 && (
        <div className="mb-1">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Demandes reçues ({incomingReqs.length})
          </h4>
          <div className="space-y-1.5">
            {incomingReqs.map((req) => (
              <div key={req.id} className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-3 py-2">
                <span className="flex-1 truncate text-sm font-medium text-slate-200">
                  {req.sender.username}
                </span>
                <button
                  type="button"
                  onClick={() => handleAccept(req)}
                  title="Accepter"
                  className="rounded-lg bg-mint/20 px-2 py-0.5 text-xs font-semibold text-mint transition hover:bg-mint/30"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(req)}
                  title="Refuser"
                  className="rounded-lg bg-coral/20 px-2 py-0.5 text-xs font-semibold text-coral transition hover:bg-coral/30"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="my-3 border-t border-white/10" />
        </div>
      )}

      <h3 className="font-display text-lg text-sky">Conversations</h3>

      {contacts.length === 0 ? (
        <p className="text-xs text-slate-500">
          Aucun contact pour le moment.{" "}
          <span className="text-slate-600">Ajoutez des contacts via la liste des connectés.</span>
        </p>
      ) : (
        <div className="space-y-1.5">
          {(contacts as DmContact[]).map((contact) => {
            const unread = unreadCounts[contact.id] ?? 0;
            const isActive = activeDmUserId === contact.id;
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => openDm(contact.id, contact.username)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  isActive ? "bg-sky/20 text-sky" : "bg-panel/70 text-slate-200 hover:bg-panel"
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
