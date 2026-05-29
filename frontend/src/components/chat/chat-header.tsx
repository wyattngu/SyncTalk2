"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatUser } from "@/services/chat";

interface ChatHeaderProps {
  user: ChatUser | null;
  isBotChat: boolean;
}


export function ChatHeader({ user, isBotChat }: ChatHeaderProps) {
  const username = user?.username ?? "Conversation";
  const initial = (user?.username?.[0] || "?").toUpperCase();

  const isOnline = !!user?.is_online;

  // The chat header username links to the public profile page so users can
  // view the other person's profile (and add as friend, etc.).
  const nameNode =
    isBotChat || !user?.id ? (
      <h2 className="text-base font-semibold text-foreground">{username}</h2>
    ) : (
      <Link
        href={`/profile/${user.id}`}
        className="text-base font-semibold text-foreground transition-colors hover:text-primary"
      >
        {username}
      </Link>
    );

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <Link
          href={!isBotChat && user?.id ? `/profile/${user.id}` : "#"}
          className="relative block shrink-0"
          tabIndex={!isBotChat && user?.id ? 0 : -1}
          aria-label={!isBotChat && user?.id ? `View ${username}'s profile` : undefined}
        >
          <Avatar className="size-10">
            {user?.profile_image_url && (
              <AvatarImage src={user.profile_image_url} alt={username} />
            )}
            <AvatarFallback
              className={cn(
                "text-sm font-bold",
                isBotChat || isOnline
                  ? "gradient-brand text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isBotChat ? <Bot className="size-5" /> : initial}
            </AvatarFallback>
          </Avatar>
          {!isBotChat && (
            <span
              aria-label={isOnline ? "online" : "offline"}
              className={cn(
                "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card",
                isOnline ? "bg-success" : "bg-muted-foreground/40",
              )}
            />
          )}
        </Link>
        <div>
          {nameNode}
          <div className="flex items-center gap-1.5">
            {isBotChat ? (
              <Badge className="bg-primary-soft text-[10px] uppercase tracking-wider text-primary hover:bg-primary-soft">
                AI · Gemini
              </Badge>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider",
                  isOnline ? "text-success" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isOnline ? "bg-success" : "bg-muted-foreground/40",
                  )}
                />
                {isOnline ? "Active now" : null}
              </span>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}
