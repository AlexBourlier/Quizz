import { create } from "zustand";
import type { DmMessage } from "../types";

type DmState = {
  conversations: Record<string, DmMessage[]>;
  unreadCounts: Record<string, number>;
  activeDmUserId: string | null;
  activeDmUsername: string | null;
  dmMode: boolean;

  setDmMode: (mode: boolean) => void;
  openDm: (userId: string, username: string) => void;
  closeDm: () => void;
  appendDmMessage: (otherUserId: string, message: DmMessage) => void;
  setDmHistory: (otherUserId: string, messages: DmMessage[]) => void;
  incrementUnread: (userId: string) => void;
  clearUnread: (userId: string) => void;
  clearConversation: (userId: string) => void;
};

export const useDmStore = create<DmState>((set) => ({
  conversations: {},
  unreadCounts: {},
  activeDmUserId: null,
  activeDmUsername: null,
  dmMode: false,

  setDmMode(mode) { set({ dmMode: mode }); },
  openDm(userId, username) { set({ activeDmUserId: userId, activeDmUsername: username }); },
  closeDm() { set({ activeDmUserId: null, activeDmUsername: null }); },
  appendDmMessage(otherUserId, message) {
    set((s) => ({
      conversations: {
        ...s.conversations,
        [otherUserId]: [...(s.conversations[otherUserId] ?? []), message],
      },
    }));
  },
  setDmHistory(otherUserId, messages) {
    set((s) => ({ conversations: { ...s.conversations, [otherUserId]: messages } }));
  },
  incrementUnread(userId) {
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [userId]: (s.unreadCounts[userId] ?? 0) + 1 },
    }));
  },
  clearUnread(userId) {
    set((s) => {
      const next = { ...s.unreadCounts };
      delete next[userId];
      return { unreadCounts: next };
    });
  },
  clearConversation(userId) {
    set((s) => {
      const convs = { ...s.conversations };
      delete convs[userId];
      const unreads = { ...s.unreadCounts };
      delete unreads[userId];
      return { conversations: convs, unreadCounts: unreads };
    });
  },
}));
