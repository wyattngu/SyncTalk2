"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { OnlineUser } from "@/services/threads";

interface OnlineUsersSidebarProps {
  users: OnlineUser[];
  onlineCount: number;
}

export function OnlineUsersSidebar({ users, onlineCount }: OnlineUsersSidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 xl:block">
      <div className="sticky top-20 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Members</h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {onlineCount} online
          </span>
        </div>

        {users.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No members yet</p>
        ) : (
          <ul className="space-y-2">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white ${
                      u.is_online ? "gradient-brand" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {u.username[0].toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                      u.is_online ? "bg-success" : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{u.username}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.is_online ? "Active now" : u.last_seen}
                  </p>
                </div>
                <Link
                  href={`/chat?userId=${u.id}`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                  aria-label={`Message ${u.username}`}
                >
                  <MessageCircle size={14} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
