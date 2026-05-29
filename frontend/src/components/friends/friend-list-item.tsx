"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePresenceStore } from "@/lib/presence-store";
import type { FriendUserSummary } from "@/services/friends";

interface FriendListItemProps {
  user: FriendUserSummary;
  /** Right-side action(s) — typically the FriendActionButton or accept/decline. */
  actions?: React.ReactNode;
  /** Optional small label under the username (e.g. "Sent 2 days ago"). */
  subtext?: string;
  /** Show a "Message" link that jumps into the chat with this user. */
  showMessageLink?: boolean;
}

export function FriendListItem({
  user,
  actions,
  subtext,
  showMessageLink = true,
}: FriendListItemProps) {
  const userStatuses = usePresenceStore((s) => s.userStatuses);
  const isOnline = userStatuses[user.id]?.is_online ?? false;

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <Link
        href={`/profile/${user.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="relative shrink-0">
          <Avatar className="size-11">
            {user.profile_image_url && (
              <AvatarImage src={user.profile_image_url} alt={user.username} />
            )}
            <AvatarFallback
              className={cn(
                "text-sm font-bold",
                isOnline
                  ? "gradient-brand text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {user.username[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span
            aria-label={isOnline ? "online" : "offline"}
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
              isOnline ? "bg-success" : "bg-muted-foreground/40",
            )}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.username}
            </p>
            {isOnline && (
              <Badge
                variant="secondary"
                className="bg-success-soft text-[10px] uppercase tracking-wider text-success hover:bg-success-soft"
              >
                Online
              </Badge>
            )}
          </div>
          {subtext && (
            <p className="truncate text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {showMessageLink && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/chat?userId=${user.id}`}>
              <MessageCircle className="size-4" />
              Message
            </Link>
          </Button>
        )}
        {actions}
      </div>
    </li>
  );
}
