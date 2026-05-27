import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "../store/auth.store";

let socket: Socket | null = null;

export function connectSocket() {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error("No access token");
  }

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    path: "/api/socket.io",
    auth: { token },
    transports: ["polling"],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
