"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import browserClient from "@/lib/api-client";
import {
  notificationsService,
  type NotificationItem,
} from "@/services/notifications";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { useAuthStore } from "@/lib/auth-store";

const ICON_BY_TYPE: Record<string, string> = {
  reply: "chat_bubble",
  like: "thumb_up",
  mention: "alternate_email",
  friend_request: "person_add",
  friend_accept: "person",
  message: "mail",
  reaction: "mood",
};

function formatRelative(iso: string): string {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return "just now";
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

interface NotificationsPopoverProps {
  unreadCount: number;
}

export function NotificationsPopover({ unreadCount }: NotificationsPopoverProps) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { setUnreadCount } = useNotificationCount();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Fetch when opening
  useEffect(() => {
    if (!open || !isAuthenticated) return;
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
  }, [open, isAuthenticated]);

  async function openItem(n: NotificationItem) {
    setOpen(false);
    try {
      if (!n.is_read) {
        await notificationsService.markRead(n.id);
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (err) {
      console.error(err);
    }
    const type = n.type?.toLowerCase();
    const msg = n.message?.toLowerCase();

    if (type === "friend_request" || msg.includes("friend request")) {
      router.push("/friends?tab=incoming");
    } else if (type === "friend_accept" || msg.includes("friend request was accepted")) {
      router.push("/friends");
    } else if (type === "message" || msg.includes("new message")) {
      router.push(`/chat?userId=${n.reference_id}`);
    } else if (n.reference_id) {
      router.push(`/threads/${n.reference_id}`);
    }
  }

  async function markAllRead() {
    const unread = items.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    try {
      await Promise.all(
        unread.map((n) =>
          browserClient.put(`/api/notifications/${n.id}/read`).catch(() => null)
        )
      );
      setItems((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-primary"
      >
        <span
          className={`material-symbols-outlined text-[20px] ${
            unreadCount > 0 ? "icon-fill text-primary" : ""
          }`}
        >
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 flex w-[360px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-display text-sm font-bold text-foreground">
                Notifications
              </p>
              <p className="text-[11px] text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="rounded-md px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {!isAuthenticated && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Sign in to see notifications.
              </p>
            )}

            {isAuthenticated && loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {isAuthenticated && !loading && items.length === 0 && (
              <div className="px-4 py-10 text-center">
                <span className="material-symbols-outlined mb-2 text-[36px] text-muted-foreground/40">
                  inbox
                </span>
                <p className="text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              </div>
            )}

            {isAuthenticated && !loading && items.length > 0 && (
              <ul className="divide-y divide-border">
                {items.slice(0, 10).map((n) => {
                  const icon = ICON_BY_TYPE[n.type] ?? "notifications";
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-low ${
                          !n.is_read ? "bg-primary-soft/30" : ""
                        }`}
                      >
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-card">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            {icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`line-clamp-2 text-sm leading-snug ${
                              !n.is_read
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {n.message}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {formatRelative(n.created_at)} ago
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {isAuthenticated && items.length > 0 && (
            <div className="border-t border-border bg-card-muted px-4 py-2 text-center">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-primary transition-colors hover:underline"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
