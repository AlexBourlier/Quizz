import { useState } from "react";
import type { Role, Room } from "../types";
import { CreateRoomModal } from "./CreateRoomModal";

type Props = {
  rooms: Room[];
  activeRoomId: string | null;
  userRole: Role;
  roomCounts: Record<string, number>;
  dmMode: boolean;
  totalUnread: number;
  isGuest?: boolean;
  onSelectRoom: (roomId: string) => void;
  onRoomCreated: (room: Room) => void;
  onMessagesClick: () => void;
};

const TYPE_ICON: Record<string, string> = {
  public: "#",
  private: "🔒",
  restricted: "🔑",
};

export function Sidebar({
  rooms, activeRoomId, userRole, roomCounts, dmMode, totalUnread, isGuest,
  onSelectRoom, onRoomCreated, onMessagesClick,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-tide/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wide text-sky">Salons</h2>
          {userRole === "admin" && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-mint/20 px-2 py-0.5 text-xs font-semibold text-mint transition hover:bg-mint/30"
            >
              + Créer
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {rooms.map((room) => {
            const count = roomCounts[room.id];
            const isActive = !dmMode && room.id === activeRoomId;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? "bg-coral text-white"
                    : "bg-panel/70 text-slate-200 hover:bg-panel"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>
                    <span className="mr-1.5 text-slate-400">{TYPE_ICON[room.type] ?? "#"}</span>
                    {room.name}
                  </span>
                  {count !== undefined && count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-sky/20 text-sky"
                    }`}>
                      {count}
                    </span>
                  )}
                </div>
                {room.rules && (
                  <p className="mt-0.5 truncate text-xs text-slate-400">{room.rules}</p>
                )}
                <div className="mt-0.5 flex gap-2 text-xs text-slate-500">
                  <span className="capitalize">{room.type}</span>
                  {room.ageLimit && <span>+{room.ageLimit} ans</span>}
                  {room.maxOccupants && <span>max {room.maxOccupants}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {!isGuest && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={onMessagesClick}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                dmMode
                  ? "bg-sky/20 text-sky"
                  : "bg-panel/70 text-slate-200 hover:bg-panel"
              }`}
            >
              <span>💬</span>
              <span className="flex-1 text-left font-medium">Messages privés</span>
              {totalUnread > 0 && (
                <span className="rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </button>
          </div>
        )}
      </aside>

      {showCreate && (
        <CreateRoomModal
          onCreated={(room) => { onRoomCreated(room); setShowCreate(false); }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}
