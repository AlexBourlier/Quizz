import axios from "axios";
import { create } from "zustand";
function decodeRole(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role ?? null;
    }
    catch {
        return null;
    }
}
// ── Manual localStorage persistence ──────────────────────────────────────────
const STORAGE_KEY = "quizztest-auth";
function loadSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return { user: null, refreshToken: null };
        const parsed = JSON.parse(raw);
        return { user: parsed.user ?? null, refreshToken: parsed.refreshToken ?? null };
    }
    catch {
        return { user: null, refreshToken: null };
    }
}
function saveSession(user, refreshToken) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, refreshToken }));
    }
    catch { /* storage quota exceeded */ }
}
function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
}
// ── Axios instance (bare — avoids circular dep with api interceptor) ──────────
const baseURL = import.meta.env.VITE_API_URL ?? "/api";
const authAxios = axios.create({ baseURL });
// ── Store ─────────────────────────────────────────────────────────────────────
const persisted = loadSession();
export const useAuthStore = create()((set, get) => ({
    user: persisted.user,
    accessToken: null,
    refreshToken: persisted.refreshToken,
    isReady: false,
    async restoreSession() {
        const { refreshToken } = get();
        if (!refreshToken) {
            set({ isReady: true });
            return;
        }
        try {
            const { data } = await authAxios.post("/auth/refresh", { refreshToken });
            const role = decodeRole(data.accessToken);
            set((state) => ({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                isReady: true,
                user: state.user && role
                    ? {
                        ...state.user,
                        role,
                        termsAcceptedAt: data.termsAcceptedAt ?? state.user.termsAcceptedAt,
                        emailVerifiedAt: data.emailVerifiedAt ?? state.user.emailVerifiedAt,
                    }
                    : state.user,
            }));
            saveSession(get().user, data.refreshToken);
        }
        catch (err) {
            const status = err?.response?.status;
            if (status === 401) {
                // Token truly invalid — clear everything
                clearSession();
                set({ user: null, accessToken: null, refreshToken: null, isReady: true });
            }
            else {
                // Network error or backend down — keep token in localStorage, mark ready
                set({ isReady: true });
            }
        }
    },
    async login(email, password) {
        const { data } = await authAxios.post("/auth/login", { email, password });
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isReady: true });
        saveSession(data.user, data.refreshToken);
    },
    async loginAsGuest() {
        const { data } = await authAxios.post("/auth/guest");
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isReady: true });
        saveSession(data.user, data.refreshToken);
    },
    async register(username, email, password, birthDate, parentEmail) {
        const { data } = await authAxios.post("/auth/register", {
            username,
            email,
            password,
            birthDate,
            ...(parentEmail ? { parentEmail } : {}),
        });
        set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isReady: true });
        saveSession(data.user, data.refreshToken);
        return {
            needsEmailVerification: data.needsEmailVerification ?? false,
            needsParentalConsent: data.needsParentalConsent ?? false,
        };
    },
    async logout() {
        const { accessToken } = get();
        if (accessToken) {
            await authAxios
                .post("/auth/logout", {}, { headers: { Authorization: `Bearer ${accessToken}` } })
                .catch(() => undefined);
        }
        clearSession();
        set({ user: null, accessToken: null, refreshToken: null });
    },
    updateUserAndTokens(accessToken, refreshToken) {
        const role = decodeRole(accessToken);
        set((state) => ({
            accessToken,
            refreshToken,
            user: state.user && role ? { ...state.user, role } : state.user
        }));
        saveSession(get().user, refreshToken);
    },
    updateColor(color) {
        set((state) => ({
            user: state.user ? { ...state.user, color } : state.user
        }));
        saveSession(get().user, get().refreshToken);
    },
    patchUser(patch) {
        set((state) => ({
            user: state.user ? { ...state.user, ...patch } : state.user
        }));
        saveSession(get().user, get().refreshToken);
    }
}));
// Kick off session restore once at module load — before React mounts.
// This avoids any StrictMode double-invoke issue entirely.
useAuthStore.getState().restoreSession();
