import { create } from "zustand";
import { api } from "../services/api";
import type { Role, User } from "../types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserAndTokens: (accessToken: string, refreshToken: string) => void;
  updateColor: (color: string) => void;
};

function decodeRole(token: string): Role | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

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
    if (get().accessToken) await api.post("/auth/logout");
    set({ user: null, accessToken: null, refreshToken: null });
  },

  updateUserAndTokens(accessToken, refreshToken) {
    const role = decodeRole(accessToken);
    set((state) => ({
      accessToken,
      refreshToken,
      user: state.user && role ? { ...state.user, role } : state.user
    }));
  },

  updateColor(color: string) {
    set((state) => ({
      user: state.user ? { ...state.user, color } : state.user
    }));
  }
}));
