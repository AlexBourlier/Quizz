import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh access token on 401 then retry once
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const { refreshToken, updateUserAndTokens, logout } = useAuthStore.getState();
    if (!refreshToken) {
      // No refresh token — just reject, don't call logout() which would clear the session
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      updateUserAndTokens(data.accessToken, data.refreshToken);
      queue.forEach((cb) => cb(data.accessToken));
      queue = [];
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      queue = [];
      await logout();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
