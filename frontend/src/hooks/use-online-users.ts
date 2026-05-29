"use client";

import { useEffect, useState } from "react";
import { usersService, type OnlineUser } from "@/services/threads";
import { useAuthStore } from "@/lib/auth-store";

export function useOnlineUsers() {
  const { isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    usersService
      .withStatus()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const onlineCount = users.filter((u) => u.is_online).length;

  return { users, onlineCount, isLoading };
}
