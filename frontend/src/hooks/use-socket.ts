"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/auth-store";
import { ClientEvents, ServerEvents } from "@/constants";

interface UseSocketResult {
  socket: Socket | null;
  connected: boolean;
}

let socketInstance: Socket | null = null;
let listenersCount = 0;

export function useSocket(): UseSocketResult {
  const { token, isAuthenticated } = useAuthStore();
  const [connected, setConnected] = useState(socketInstance?.connected ?? false);
  const [socket, setSocket] = useState<Socket | null>(socketInstance);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      setSocket(null);
      setConnected(false);
      return;
    }

    if (!socketInstance) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://synctalk-backend-ky7f.onrender.com";
      socketInstance = io(baseUrl, {
        auth: { token },
        withCredentials: true,
        transports: ["websocket"],
      });
    }

    const instance = socketInstance;
    setSocket(instance);
    setConnected(instance.connected);

    const onConnect = () => {
      setConnected(true);
      instance.emit(ClientEvents.JOIN, { token });
      instance.emit(ClientEvents.AUTHENTICATE, { token });
    };
    const onDisconnect = () => setConnected(false);
    const onError = (err: unknown) => console.error("[Socket Error]", err);

    instance.on(ServerEvents.CONNECT, onConnect);
    instance.on(ServerEvents.DISCONNECT, onDisconnect);
    instance.on(ServerEvents.CONNECT_ERROR, onError);

    // If already connected, ensure state is correct and identify
    if (instance.connected) {
      onConnect();
    }

    return () => {
      instance.off(ServerEvents.CONNECT, onConnect);
      instance.off(ServerEvents.DISCONNECT, onDisconnect);
      instance.off(ServerEvents.CONNECT_ERROR, onError);
    };
  }, [token, isAuthenticated]);

  return { socket, connected };
}
