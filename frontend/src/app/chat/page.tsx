"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Image as ImageIcon, Search } from "lucide-react";
import DirectChatPanel from "@/components/chat/direct-chat-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useConversations } from "@/hooks/use-conversations";
import { useSocket } from "@/hooks/use-socket";
import { useAuthStore } from "@/lib/auth-store";
import { usePresenceStore } from "@/lib/presence-store";
import { cn } from "@/lib/utils";
import {
  isBotUsername,
  type ConversationSummary,
} from "@/services/chat";

function previewLabel(c: ConversationSummary, myId: string | null): string {
  const lm = c.last_message;
  if (!lm) return "No messages yet";
  const prefix = lm.sender_id === myId ? "You: " : "";
  if (lm.content && lm.content.trim()) {
    return `${prefix}${lm.content}`;
  }
  if (lm.image_url) return `${prefix}📷 Photo`;
  return `${prefix}…`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return new Date(iso).toLocaleDateString("en-GB");
}

function ChatContent() {
  const { connected, socket } = useSocket();
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const { onlineCount } = usePresenceStore();
  const { conversations, loading, totalUnread } = useConversations({
    socket,
    activeUserId,
  });

  useEffect(() => {
    if (!isAuthenticated) router.push("/sign-in");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (loading || conversations.length === 0) return;
    if (targetUserId && conversations.find((c) => c.id === targetUserId)) {
      setActiveUserId(targetUserId);
      return;
    }
    if (activeUserId === null) {
      setActiveUserId(conversations[0].id);
    }
  }, [loading, conversations, targetUserId, activeUserId]);

  const activeConversation =
    activeUserId !== null
      ? conversations.find((c) => c.id === activeUserId) ?? null
      : null;

  const isBotChat = isBotUsername(activeConversation?.username);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    // Bot is now a floating assistant, so hide from DM list
    const nonBotConversations = conversations.filter((c) => {
        const username = c.username.toLowerCase();
        return !(username.includes("bot") || username.includes("ai") || isBotUsername(c.username));
    });

    if (!q) return nonBotConversations;

    return nonBotConversations.filter(
      (c) =>
        c.username.toLowerCase().includes(q) ||
        (c.last_message?.content ?? "").toLowerCase().includes(q),
    );
  }, [conversations, filter]);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <aside className="flex h-full w-[340px] shrink-0 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Direct Messages
            </h2>
            <div className="flex items-center gap-1.5">
              {totalUnread > 0 && (
                <Badge className="bg-primary text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  {totalUnread} unread
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="bg-success-soft text-[10px] font-bold uppercase tracking-wider text-success hover:bg-success-soft"
              >
                {Math.max(0, Math.max(onlineCount, conversations.filter(c => c.is_online).length) - 1)} online
              </Badge>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search messages..."
              className="w-full rounded-lg border border-border bg-surface-container py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              Loading...
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              {filter ? "No matches" : "No conversations yet"}
            </p>
          )}

          {!loading &&
            filtered.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                isActive={activeUserId === c.id}
                myId={user?.id ?? null}
                onClick={() => setActiveUserId(c.id)}
              />
            ))}
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-card">
        {activeUserId && activeConversation ? (
          <DirectChatPanel
            otherUserId={activeUserId}
            otherUser={{
              id: activeConversation.id,
              username: activeConversation.username,
              is_online: activeConversation.is_online,
              profile_image_url: activeConversation.profile_image_url,
            }}
            socket={socket}
            connected={connected}
            isBotChat={isBotChat}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
              <span className="material-symbols-outlined text-[32px]">forum</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Pick a conversation
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Select someone from the list on the left to start chatting.
              Need a hand? Message{" "}
              <span className="font-semibold text-primary">SyncBot</span> — our
              AI assistant.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

interface ConversationRowProps {
  conversation: ConversationSummary;
  isActive: boolean;
  myId: string | null;
  onClick: () => void;
}

function ConversationRow({
  conversation: c,
  isActive,
  myId,
  onClick,
}: ConversationRowProps) {
  const isBot = isBotUsername(c.username);
  const hasUnread = c.unread_count > 0;
  const preview = previewLabel(c, myId);
  const time = timeAgo(c.last_message?.created_at ?? null);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors",
        isActive
          ? "border border-border bg-surface-container-low"
          : "border border-transparent hover:bg-surface-container-low",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="size-12">
          {c.profile_image_url && (
            <AvatarImage src={c.profile_image_url} alt={c.username} />
          )}
          <AvatarFallback
            className={cn(
              "text-sm font-bold",
              c.is_online || isBot
                ? "gradient-brand text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isBot ? <Bot className="size-5" /> : c.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {c.is_online && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h4
            className={cn(
              "truncate text-sm",
              hasUnread
                ? "font-bold text-foreground"
                : "font-semibold text-foreground",
            )}
          >
            {c.username}
            {isBot && (
              <Badge className="ml-1.5 bg-primary-soft text-[9px] font-bold uppercase tracking-wider text-primary hover:bg-primary-soft">
                AI
              </Badge>
            )}
          </h4>
          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-xs",
              hasUnread
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            {c.last_message?.image_url && !c.last_message.content && (
              <ImageIcon className="mr-1 inline size-3" />
            )}
            {preview}
          </p>
          {hasUnread && (
            <span
              aria-label={`${c.unread_count} unread`}
              className="grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground"
            >
              {c.unread_count > 99 ? "99+" : c.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Chat() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-card text-sm text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
