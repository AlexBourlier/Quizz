import { create } from "zustand";
import type { BlockedUser, ContactRequest, DmContact } from "../types";

type ContactStore = {
  contacts: DmContact[];
  sentPendingIds: string[];
  incomingRequests: ContactRequest[];
  blockedUsers: BlockedUser[];

  setContacts: (contacts: DmContact[]) => void;
  addContact: (contact: DmContact) => void;
  removeContact: (userId: string) => void;
  setSentPendingIds: (ids: string[]) => void;
  addSentPendingId: (id: string) => void;
  removeSentPendingId: (id: string) => void;
  setIncomingRequests: (requests: ContactRequest[]) => void;
  addIncomingRequest: (request: ContactRequest) => void;
  removeIncomingRequest: (requestId: string) => void;
  setBlockedUsers: (users: BlockedUser[]) => void;
  addBlockedUser: (user: BlockedUser) => void;
  removeBlockedUser: (blockedId: string) => void;
};

export const useContactStore = create<ContactStore>((set) => ({
  contacts: [],
  sentPendingIds: [],
  incomingRequests: [],
  blockedUsers: [],

  setContacts(contacts) { set({ contacts }); },
  addContact(contact) {
    set((s) => {
      if (s.contacts.some((c) => c.id === contact.id)) return s;
      return { contacts: [contact, ...s.contacts] };
    });
  },
  removeContact(userId) {
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== userId) }));
  },

  setSentPendingIds(ids) { set({ sentPendingIds: ids }); },
  addSentPendingId(id) {
    set((s) => ({ sentPendingIds: [...s.sentPendingIds.filter((i) => i !== id), id] }));
  },
  removeSentPendingId(id) {
    set((s) => ({ sentPendingIds: s.sentPendingIds.filter((i) => i !== id) }));
  },

  setIncomingRequests(requests) { set({ incomingRequests: requests }); },
  addIncomingRequest(request) {
    set((s) => {
      if (s.incomingRequests.some((r) => r.id === request.id)) return s;
      return { incomingRequests: [request, ...s.incomingRequests] };
    });
  },
  removeIncomingRequest(requestId) {
    set((s) => ({ incomingRequests: s.incomingRequests.filter((r) => r.id !== requestId) }));
  },

  setBlockedUsers(users) { set({ blockedUsers: users }); },
  addBlockedUser(user) {
    set((s) => {
      if (s.blockedUsers.some((b) => b.blockedId === user.blockedId)) return s;
      return { blockedUsers: [user, ...s.blockedUsers] };
    });
  },
  removeBlockedUser(blockedId) {
    set((s) => ({ blockedUsers: s.blockedUsers.filter((b) => b.blockedId !== blockedId) }));
  },
}));
