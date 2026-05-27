import { create } from "zustand";
export const useDmStore = create((set) => ({
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
