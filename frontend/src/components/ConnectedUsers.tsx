import { useState } from "react";
import type { ConnectedUser } from "../types";
import { UserActionModal } from "./UserActionModal";

type Props = {
  users: ConnectedUser[];
  currentUserId?: string;
  isGuest?: boolean;
  roomId?: string;
  onDmUser?: (userId: string, username: string) => void;
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  admin:     { label: "ADM", className: "bg-coral/20 text-coral" },
  moderator: { label: "MOD", className: "bg-sky/20 text-sky" },
};

type ActionTarget = { id: string; username: string; role: string };

export function ConnectedUsers({ users, currentUserId, isGuest, roomId, onDmUser }: Props) {
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);

  return (
    <>
      <aside className="flex h-full w-full flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-tide/80 p-4">
        <h3 className="font-display text-lg text-sky">
          Connectés <span className="ml-1 text-sm text-slate-400">({users.length})</span>
        </h3>

        {users.length === 0 ? (
          <p className="text-xs text-slate-500">Aucun utilisateur</p>
        ) : (
          <div className="space-y-1.5">
            {users.map((user) => {
              const isRoomMod = user.isRoomMod && user.role !== "admin" && user.role !== "moderator";
              const badge = isRoomMod
                ? { label: "MOD", className: "bg-sky/20 text-sky" }
                : ROLE_BADGE[user.role];
              const dot =
                user.role === "admin"     ? "bg-coral"
                : user.role === "moderator" || isRoomMod ? "bg-sky"
                : "bg-mint";
              const isSelf = user.id === currentUserId;
              const clickable = !isSelf && !isGuest;

              return (
                <div
                  key={user.id}
                  onClick={clickable ? () => setActionTarget({ id: user.id, username: user.username, role: user.role }) : undefined}
                  className={`flex items-center gap-2 rounded-lg bg-ink/70 px-3 py-2 ${clickable ? "cursor-pointer transition hover:bg-ink/90" : ""}`}
                >
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />
                  <span className="flex-1 truncate text-sm text-slate-200">{user.username}</span>
                  {badge && (
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                  {isSelf && <span className="text-xs text-slate-500">vous</span>}
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {actionTarget && (
        <UserActionModal
          userId={actionTarget.id}
          username={actionTarget.username}
          userRole={actionTarget.role}
          roomId={roomId}
          onClose={() => setActionTarget(null)}
          onDm={onDmUser ? () => onDmUser(actionTarget.id, actionTarget.username) : undefined}
        />
      )}
    </>
  );
}
