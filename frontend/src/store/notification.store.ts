import { create } from "zustand";

export type Toast = {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
};

type NotificationState = {
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
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
