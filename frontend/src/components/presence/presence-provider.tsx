"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { ServerEvents } from "@/constants";
import { usePresenceStore } from "@/lib/presence-store";
import { useAuthStore } from "@/lib/auth-store";
import { usersService } from "@/services/threads";

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { socket, connected } = useSocket();
  const { token } = useAuthStore();
  const { setOnlineCount, updateUserStatus } = usePresenceStore();

  // Load initial statuses from API when authenticated
  useEffect(() => {
    if (!token) return;
    usersService.withStatus().then((users) => {
      users.forEach((u) => updateUserStatus(u.id, u.is_online, u.last_seen));
    }).catch(() => {});
  }, [token, updateUserStatus]);

  useEffect(() => {
    if (!socket || !connected || !token) return;

    const handleOnlineCount = (data: { count: number }) => {
      setOnlineCount(data.count);
    };

    const handleStatusChange = (data: {
      user_id: string;
      is_online: boolean;
      last_seen: string;
    }) => {
      updateUserStatus(data.user_id, data.is_online, data.last_seen);
    };

    socket.on(ServerEvents.ONLINE_COUNT, handleOnlineCount);
    socket.on(ServerEvents.USER_STATUS_CHANGE, handleStatusChange);

    return () => {
      socket.off(ServerEvents.ONLINE_COUNT, handleOnlineCount);
      socket.off(ServerEvents.USER_STATUS_CHANGE, handleStatusChange);
    };
  }, [socket, connected, token, setOnlineCount, updateUserStatus]);

  return <>{children}</>;
}
