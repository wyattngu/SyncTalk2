"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Inbox, Send, Users, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FriendListItem } from "@/components/friends/friend-list-item";
import { useAuthStore } from "@/lib/auth-store";
import { useFriends } from "@/hooks/use-friends";
import { friendsService } from "@/services/friends";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FriendsTab = {
  ALL: "all",
  INCOMING: "incoming",
  OUTGOING: "outgoing",
} as const;
type FriendsTabValue = (typeof FriendsTab)[keyof typeof FriendsTab];

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 1) return "Today";
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
    }
    return new Date(iso).toLocaleDateString("en-GB");
  } catch {
    return "";
  }
}

interface ConfirmUnfriend {
  requestId: string;
  userId: string;
  username: string;
}

export default function FriendsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full px-6 py-8">
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        </div>
      }
    >
      <FriendsPageContent />
    </Suspense>
  );
}

function FriendsPageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { friends, pending, loading, refresh } = useFriends();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as FriendsTabValue) || FriendsTab.ALL;
  const [tab, setTab] = useState<FriendsTabValue>(initialTab);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmUnfriend, setConfirmUnfriend] = useState<ConfirmUnfriend | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push("/sign-in");
  }, [isAuthenticated, router]);

  async function withBusy(
    requestId: string,
    fn: () => Promise<void>,
    successMessage: string,
  ) {
    if (busyId) return;
    setBusyId(requestId);
    try {
      await fn();
      toast.success(successMessage);
      await refresh();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Something went wrong";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  }

  const incomingCount = pending.incoming.length;
  const outgoingCount = pending.outgoing.length;

  return (
    <div className="mx-auto w-full px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          My friends
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect with people you know — accepted friends and pending requests.
        </p>
      </div>

      {/* Tab strip — simple button group, no extra dep */}
      <div className="mb-5 inline-flex rounded-xl border border-border bg-surface-container-low p-1">
        <TabButton
          active={tab === FriendsTab.ALL}
          onClick={() => setTab(FriendsTab.ALL)}
          icon={<Users className="size-4" />}
          label="All"
          count={friends.length}
        />
        <TabButton
          active={tab === FriendsTab.INCOMING}
          onClick={() => setTab(FriendsTab.INCOMING)}
          icon={<Inbox className="size-4" />}
          label="Incoming"
          count={incomingCount}
          highlight={incomingCount > 0}
        />
        <TabButton
          active={tab === FriendsTab.OUTGOING}
          onClick={() => setTab(FriendsTab.OUTGOING)}
          icon={<Send className="size-4" />}
          label="Sent"
          count={outgoingCount}
        />
      </div>

      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      )}

      {!loading && tab === FriendsTab.ALL && (
        <FriendsList
          empty="You don't have any friends yet. Visit a profile to send a request."
          items={friends.map((f) => (
            <FriendListItem
              key={f.request_id}
              user={f.user}
              subtext={`Friends since ${formatRelative(f.created_at)}`}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === f.request_id}
                  onClick={() =>
                    setConfirmUnfriend({
                      requestId: f.request_id,
                      userId: f.user.id,
                      username: f.user.username,
                    })
                  }
                  className="text-destructive hover:text-destructive"
                >
                  Unfriend
                </Button>
              }
            />
          ))}
        />
      )}

      {!loading && tab === FriendsTab.INCOMING && (
        <FriendsList
          empty="No pending friend requests."
          items={pending.incoming.map((f) => (
            <FriendListItem
              key={f.request_id}
              user={f.user}
              subtext={`Requested ${formatRelative(f.created_at)}`}
              actions={
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === f.request_id}
                    onClick={() =>
                      void withBusy(
                        f.request_id,
                        () => friendsService.acceptRequest(f.request_id),
                        "Friend request accepted",
                      )
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === f.request_id}
                    onClick={() =>
                      void withBusy(
                        f.request_id,
                        () => friendsService.declineRequest(f.request_id),
                        "Friend request declined",
                      )
                    }
                  >
                    Decline
                  </Button>
                </div>
              }
            />
          ))}
        />
      )}

      {!loading && tab === FriendsTab.OUTGOING && (
        <FriendsList
          empty="You haven't sent any friend requests."
          items={pending.outgoing.map((f) => (
            <FriendListItem
              key={f.request_id}
              user={f.user}
              subtext={`Sent ${formatRelative(f.created_at)}`}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === f.request_id}
                  onClick={() =>
                    void withBusy(
                      f.request_id,
                      () => friendsService.cancelRequest(f.request_id),
                      "Friend request cancelled",
                    )
                  }
                >
                  Cancel
                </Button>
              }
            />
          ))}
        />
      )}

      {/* Unfriend confirmation dialog */}
      {confirmUnfriend && (
        <div role="dialog" aria-modal="true" aria-labelledby="unfriend-dialog-title" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmUnfriend(null)}
          />
          {/* Dialog */}
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <UserMinus className="size-7 text-destructive" />
              </div>
            </div>
            {/* Content */}
            <div className="mb-6 text-center">
              <h2 id="unfriend-dialog-title" className="mb-1 text-lg font-bold text-foreground">
                Remove friend?
              </h2>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-foreground">
                  {confirmUnfriend.username}
                </span>{" "}
                from your friends? You can always send a new request later.
              </p>
            </div>
            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmUnfriend(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={busyId === confirmUnfriend.requestId}
                onClick={() => {
                  const { requestId, userId } = confirmUnfriend;
                  setConfirmUnfriend(null);
                  void withBusy(
                    requestId,
                    () => friendsService.unfriend(userId),
                    "Removed from friends",
                  );
                }}
              >
                <UserMinus className="mr-2 size-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  highlight?: boolean;
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  highlight,
}: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
      <Badge
        variant={highlight && !active ? "destructive" : "secondary"}
        className="ml-1"
      >
        {count}
      </Badge>
    </button>
  );
}

interface FriendsListProps {
  items: React.ReactNode[];
  empty: string;
}

function FriendsList({ items, empty }: FriendsListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {empty}
        </CardContent>
      </Card>
    );
  }
  return <ul className="space-y-3">{items}</ul>;
}
