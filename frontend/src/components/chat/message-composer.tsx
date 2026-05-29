"use client";

import { ChangeEvent, KeyboardEvent, useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ImageUploadButton from "./image-upload-button";

interface MessageComposerProps {
  isBotChat: boolean;
  isBlocked: boolean;
  connected: boolean;
  sending: boolean;
  aiThinking: boolean;
  onSend: (content: string, imageUrl: string | null) => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
}

export function MessageComposer({
  isBotChat,
  isBlocked,
  connected,
  sending,
  aiThinking,
  onSend,
  onTyping,
  onStopTyping,
}: MessageComposerProps) {
  const [input, setInput] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const transportReady = isBotChat || (connected && !isBlocked);
  const disabled = !transportReady || sending || aiThinking;
  const canSend =
    !sending &&
    !aiThinking &&
    transportReady &&
    (!!input.trim() || !!pendingImageUrl);

  const placeholder = isBlocked
    ? "Cannot send messages to this user"
    : pendingImageUrl
      ? "Add a caption (optional)..."
      : isBotChat
        ? "Chat with SyncBot AI..."
        : "Type a message... (use @sync to ask the AI)";

  function handleInputChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    if (!isBotChat) onTyping();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void doSend();
    }
  }

  async function doSend() {
    const body = input;
    const image = pendingImageUrl;
    if (!body.trim() && !image) return;
    setInput("");
    setPendingImageUrl(null);
    if (!isBotChat) onStopTyping();
    await onSend(body, image);
  }

  return (
    <div className="border-t border-border bg-card p-4">
      {pendingImageUrl && (
        <div className="relative mb-4 group inline-block">
          <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm transition-all hover:shadow-md">
            <img
              src={pendingImageUrl}
              alt="preview"
              className="h-32 w-48 object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => setPendingImageUrl(null)}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-red-500 hover:scale-110 shadow-lg"
            title="Remove image"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-container-low px-4 py-3 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
        {!isBotChat && (
          <div className="mb-0.5">
            <ImageUploadButton
              onImageUpload={(url) => setPendingImageUrl(url)}
              pendingImageUrl={pendingImageUrl}
              onClearImage={() => setPendingImageUrl(null)}
            />
          </div>
        )}
        <Textarea
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[2.25rem] flex-1 resize-none border-0 bg-transparent py-2 text-sm shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          onClick={doSend}
          disabled={!canSend}
          size="icon"
          title="Send"
          className="mb-0.5 size-9 shrink-0 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
