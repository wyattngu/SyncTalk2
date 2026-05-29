"use client";

import { Bot, Check, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AI_BOT_SENDER_ID } from "@/constants";
import type { DirectMessage } from "@/services/chat";

interface MessageBubbleProps {
  msg: DirectMessage;
  myId: string;
  otherName: string;
  /** True only on the most recent own message the other user has read.
   *  Used to render the single "Seen" indicator at the thread tail. */
  isLastSeen?: boolean;
  onDelete: (id: string) => void;
}

function isAIMessage(msg: DirectMessage): boolean {
  return msg.is_ai === true || msg.sender_id === AI_BOT_SENDER_ID;
}

export function MessageBubble({
  msg,
  myId,
  otherName,
  isLastSeen = false,
  onDelete,
}: MessageBubbleProps) {
  const isAI = isAIMessage(msg);
  const isMine = !isAI && msg.sender_id === myId;
  const isPending = !!msg.pending;
  const showSeen = isMine && isLastSeen;
  const time = new Date(msg.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const label = isAI ? "SyncBot AI" : isMine ? "You" : otherName;
  const canDelete = isMine && !isAI && !isPending;

  return (
    <div
      className={cn(
        "group flex gap-2",
        isMine ? "justify-end" : "justify-start",
      )}
    >
      <div className={cn("max-w-md", isMine && "order-2")}>
        <div
          className={cn(
            "mb-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground",
            isMine ? "justify-end" : "justify-start",
          )}
        >
          {isAI && (
            <span className="grid h-4 w-4 place-items-center rounded-full bg-primary-soft text-primary">
              <Bot className="size-3" />
            </span>
          )}
          <span>
            {label} · {time}
          </span>
          {isPending && <Loader2 className="size-3 animate-spin" />}
          {msg.edited_at && <span className="italic">(edited)</span>}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(msg.id)}
              className="ml-1 size-5 opacity-0 hover:bg-destructive-soft hover:text-destructive group-hover:opacity-100"
              title="Delete"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>

        {msg.content && (
          <div
            className={cn(
              "inline-block rounded-2xl px-4 py-2.5",
              isAI
                ? "bg-secondary-container border border-border text-foreground"
                : isMine
                  ? "gradient-brand text-primary-foreground"
                  : "bg-card border border-border text-foreground",
              isPending && "opacity-70",
            )}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {msg.content}
            </p>
          </div>
        )}

        {msg.image_url && (
          <div
            className={cn(
              "overflow-hidden rounded-xl border border-border",
              msg.content ? "mt-2" : "mt-1",
              isPending && "opacity-70",
            )}
          >
            <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
              <img
                src={msg.image_url}
                alt="attachment"
                className="max-h-64 max-w-xs cursor-pointer rounded-xl object-cover transition-opacity hover:opacity-90"
              />
            </a>
          </div>
        )}

        {/* "Seen" indicator on the most recent own message the other user
            has read. Shown once at the thread tail, like Messenger / iMessage. */}
        {showSeen && (
          <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium text-primary">
            <CheckCheck className="size-3" />
            Seen
          </p>
        )}

        {/* For own messages that have been delivered but not yet read,
            show a subtle single check so the user knows the send succeeded. */}
        {isMine && !isPending && !msg.is_read && !showSeen && (
          <p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium text-muted-foreground">
            <Check className="size-3" />
            Sent
          </p>
        )}
      </div>
    </div>
  );
}
