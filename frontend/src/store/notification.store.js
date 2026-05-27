import { create } from "zustand";
export const useNotificationStore = create((set) => ({
    toasts: [],
    addToast(type, message) {
        const id = crypto.randomUUID();
        set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 5000);
    },
    removeToast(id) {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }
}));
