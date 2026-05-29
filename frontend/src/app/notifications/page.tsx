"use client";

import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationItem } from "@/services/notifications";

const ICON_BY_TYPE: Record<string, string> = {
  reply: "chat_bubble",
  like: "thumb_up",
  mention: "alternate_email",
  friend_request: "person_add",
  friend_accept: "person",
  message: "mail",
  reaction: "mood",
};

export default function NotificationsPage() {
  const { items, loading, open } = useNotifications();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stay up to date with replies, likes, and mentions.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading && (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="px-6 py-12 text-center">
            <span className="material-symbols-outlined mb-3 text-[40px] text-muted-foreground/40">
              inbox
            </span>
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <ul className="divide-y divide-border">
            {items.map((n: NotificationItem) => {
              const icon = ICON_BY_TYPE[n.type] ?? "notifications";
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-container-low ${
                      !n.is_read ? "bg-primary-soft/40" : ""
                    }`}
                  >
                    <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card border border-border">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        {icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-sm ${
                            !n.is_read
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {n.message}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(n.created_at).toLocaleString("en-GB")}
                        </span>
                      </div>
                      {!n.is_read && (
                        <span className="mt-1.5 inline-flex rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                          NEW
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
