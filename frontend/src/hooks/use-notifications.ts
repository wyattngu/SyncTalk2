"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { notificationsService, type NotificationItem } from "@/services/notifications";
import { useNotificationCount } from "@/hooks/use-notification-count";

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { decrementUnread } = useNotificationCount();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    let mounted = true;
    setLoading(true);
    notificationsService
      .list()
      .then((list) => {
        if (mounted) setItems(list);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const open = useCallback(
    async (n: NotificationItem) => {
      try {
        if (!n.is_read) {
          await notificationsService.markRead(n.id);
          setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
          decrementUnread();
        }
      } catch (err) {
        console.error(err);
      }
      const type = n.type?.toLowerCase();
      const msg = n.message?.toLowerCase();

      if (type === "friend_request" || msg?.includes("friend request")) {
        router.push("/friends?tab=incoming");
      } else if (type === "friend_accept" || msg?.includes("friend request was accepted")) {
        router.push("/friends");
      } else if (type === "message" || msg?.includes("new message")) {
        router.push(`/chat?userId=${n.reference_id}`);
      } else if (n.reference_id) {
        router.push(`/threads/${n.reference_id}`);
      }
    },
    [decrementUnread, router]
  );

  return { items, loading, open };
}
