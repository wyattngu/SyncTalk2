"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { profileService, type BlockedUser } from "@/services/profile";

export function useProfile() {
  const { user, setUser, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    let mounted = true;
    setLoading(true);
    profileService
      .me()
      .then((u) => {
        if (mounted) setUser(u);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    profileService
      .listBlocked()
      .then((list) => {
        if (mounted) setBlockedUsers(list);
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const updateUsername = useCallback(
    async (username: string) => {
      const updated = await profileService.update({ username });
      setUser(updated);
      return updated;
    },
    [setUser]
  );

  const unblock = useCallback(async (id: string) => {
    await profileService.unblock(id);
    setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const signOut = useCallback(() => {
    logout();
    router.push("/sign-in");
  }, [logout, router]);

  return { user, loading, blockedUsers, updateUsername, unblock, signOut };
}
