"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useSocket } from "@/hooks/use-socket";
import browserClient from "@/lib/api-client";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { useAuthStore } from "@/lib/auth-store";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { apiPaths, ServerEvents } from "@/constants";

function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { socket } = useSocket();
  const { unreadCount, setUnreadCount, incrementUnread } = useNotificationCount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    browserClient
      .get(apiPaths.NOTIFICATIONS_UNREAD)
      .then((res) => setUnreadCount(res.data.data?.length ?? 0))
      .catch(console.error);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    const handle = (payload: any) => {
      incrementUnread();
      toast("New notification", {
        description: payload.message || "You have a new notification",
        action: {
          label: "View",
          onClick: () => {
            const type = payload.type;
            const refId = payload.reference_id;
            if (type === "friend_request") {
              router.push("/friends?tab=incoming");
            } else if (type === "friend_accept") {
              router.push("/friends");
            } else if (type === "message") {
              router.push(`/chat?userId=${refId}`);
            } else if (refId) {
              router.push(`/threads/${refId}`);
            }
          },
        },
      });
    };
    socket.on(ServerEvents.NOTIFICATION_NEW, handle);
    return () => {
      socket.off(ServerEvents.NOTIFICATION_NEW, handle);
    };
  }, [socket, incrementUnread]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!mounted) return null;
  if (pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) return null;

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    router.push("/sign-in");
  };



  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Left: brand + search */}
      <div className="flex flex-1 items-center gap-6">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-primary">
          SyncTalk
        </Link>


      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <NotificationsPopover unreadCount={unreadCount} />

            <div ref={profileRef} className="relative ml-1">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-border-strong gradient-brand text-sm font-bold text-primary-foreground"
                aria-label="Profile menu"
              >
                {user?.username?.[0]?.toUpperCase() || "U"}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{user?.username}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      My profile
                    </Link>
                    <Link
                      href="/my-posts"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">article</span>
                      My posts
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-destructive-soft hover:text-destructive"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link href="/sign-in">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover">
              Sign in
            </button>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;
