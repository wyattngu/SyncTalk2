"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { profileService } from "@/services/profile";

export function AuthHydrator() {
  const { isAuthenticated, user, isLoaded, setUser, setIsLoaded } =
    useAuthStore();

  useEffect(() => {
    if (isLoaded) return;

    if (!isAuthenticated) {
      setIsLoaded(true);
      return;
    }

    if (user) {
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    profileService
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // 401 interceptor in api-client redirects to /sign-in.
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, isLoaded, setUser, setIsLoaded]);

  return null;
}
