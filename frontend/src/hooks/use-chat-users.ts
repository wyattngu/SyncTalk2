// src/hooks/use-chat-users.ts

"use client";

import { useEffect, useState } from "react";
import { type Socket } from "socket.io-client";
import { chatService, type ChatUser } from "@/services/chat";
import { useAuthStore } from "@/lib/auth-store";
import { ServerEvents, type UserPresencePayload } from "@/constants";

interface UseChatUsersResult {
  users: ChatUser[];
  loading: boolean;
  onlineCount: number;
}

/**
 * Loads the chat user list and keeps `is_online` flags in sync with
 * `user_online` / `user_offline` socket events.
 */
export function useChatUsers(socket: Socket | null): UseChatUsersResult {
  const { isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setUsers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    chatService
      .listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((err) => console.error("[useChatUsers] load error:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    function setOnline(userId: string, isOnline: boolean) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_online: isOnline } : u)),
      );
    }

    function handleOnline(data: UserPresencePayload) {
      setOnline(data.user_id, true);
    }

    function handleOffline(data: UserPresencePayload) {
      setOnline(data.user_id, false);
    }

    socket.on(ServerEvents.USER_ONLINE, handleOnline);
    socket.on(ServerEvents.USER_OFFLINE, handleOffline);

    return () => {
      socket.off(ServerEvents.USER_ONLINE, handleOnline);
      socket.off(ServerEvents.USER_OFFLINE, handleOffline);
    };
  }, [socket]);

  const onlineCount = users.filter((u) => u.is_online).length;

  return { users, loading, onlineCount };
}
