import { create } from "zustand";
import { api } from "../services/api";
import type { User } from "../types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  async login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
  },
  async register(username, email, password) {
    const { data } = await api.post("/auth/register", { username, email, password });
    set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
  },
  async logout() {
    const token = get().accessToken;
    if (token) {
      await api.post("/auth/logout");
    }
    set({ user: null, accessToken: null, refreshToken: null });
  }
}));
