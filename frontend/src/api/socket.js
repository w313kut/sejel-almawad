import { io } from "socket.io-client";
import { api } from "./client";

let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();
  const target = api.API_URL || window.location.origin;
  socket = io(target, { auth: { token }, transports: ["websocket", "polling"] });
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
