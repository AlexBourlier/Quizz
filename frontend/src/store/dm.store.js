import { create } from "zustand";
export const useDmStore = create((set) => ({
    conversations: {},
    contacts: [],
    unreadCounts: {},
    activeDmUserId: null,
    activeDmUsername: null,
    dmMode: false,
    setDmMode(mode) {
        set({ dmMode: mode });
    },
    openDm(userId, username) {
        set({ activeDmUserId: userId, activeDmUsername: username });
    },
    closeDm() {
        set({ activeDmUserId: null, activeDmUsername: null });
    },
    appendDmMessage(otherUserId, message) {
        set((s) => ({
            conversations: {
                ...s.conversations,
                [otherUserId]: [...(s.conversations[otherUserId] ?? []), message],
            },
        }));
    },
    setDmHistory(otherUserId, messages) {
        set((s) => ({
            conversations: { ...s.conversations, [otherUserId]: messages },
        }));
    },
    setContacts(contacts) {
        set({ contacts });
    },
    addContact(contact) {
        set((s) => {
            if (s.contacts.some((c) => c.id === contact.id))
                return s;
            return { contacts: [contact, ...s.contacts] };
        });
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
}));
