"use client";

import { useEffect, useMemo, useRef } from "react";
import { Bot, MessageSquare } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import type { DirectMessage } from "@/services/chat";

/**
 * The id of the most recent OWN message that the other user has read.
 * Used so the "Seen" indicator renders on exactly one bubble at the
 * bottom of the thread (the convention every messaging app follows).
 */
function findLastSeenMessageId(
  messages: DirectMessage[],
  myId: string,
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (
      m.sender_id === myId &&
      m.is_read &&
      !m.pending &&
      !m.is_ai
    ) {
      return m.id;
    }
  }
  return null;
}

interface MessageListProps {
  messages: DirectMessage[];
  isLoading: boolean;
  isBotChat: boolean;
  myId: string;
  otherName: string;
  typingLabel: string | null;
  aiThinking: boolean;
  onDeleteMessage: (id: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  isBotChat,
  myId,
  otherName,
  typingLabel,
  aiThinking,
  onDeleteMessage,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiThinking]);

  const lastSeenMessageId = useMemo(
    () => (isBotChat ? null : findLastSeenMessageId(messages, myId)),
    [messages, myId, isBotChat],
  );

  return (
    <div className="flex-1 space-y-4 overflow-y-auto bg-surface-container-low/30 px-6 py-5">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-xs text-muted-foreground">Loading messages...</p>
        </div>
      )}

      {!isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
            {isBotChat ? (
              <Bot className="size-6" />
            ) : (
              <MessageSquare className="size-6" />
            )}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {isBotChat
              ? "Hi there! I'm SyncBot AI. Ask me anything!"
              : "No messages yet. Say hello!"}
          </p>
        </div>
      )}

      {!isLoading &&
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            myId={myId}
            otherName={otherName}
            isLastSeen={lastSeenMessageId === msg.id}
            onDelete={onDeleteMessage}
          />
        ))}

      {(typingLabel || aiThinking) && (
        <div className="flex items-center gap-2 px-1 text-xs italic text-muted-foreground">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
          </span>
          {aiThinking ? "SyncBot is thinking..." : typingLabel}
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
