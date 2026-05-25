import type { Room } from "../types";

type Props = {
  rooms: Room[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
};

export function Sidebar({ rooms, activeRoomId, onSelectRoom }: Props) {
  return (
    <aside className="w-full rounded-2xl border border-white/10 bg-tide/80 p-4">
      <h2 className="font-display text-lg tracking-wide text-sky">Salons</h2>
      <div className="mt-4 space-y-2">
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelectRoom(room.id)}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
              room.id === activeRoomId
                ? "bg-coral text-white"
                : "bg-panel/70 text-slate-200 hover:bg-panel"
            }`}
          >
            <span className="mr-2 text-slate-400">#</span>
            {room.name}
            <span className="ml-2 text-xs uppercase text-slate-400">{room.type}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
