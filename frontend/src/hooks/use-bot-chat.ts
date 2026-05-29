"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { askAI } from "@/lib/api-client";
import { useChatStore } from "@/lib/chat-store";
import { AI_BOT_SENDER_ID } from "@/constants";
import type { DirectMessage } from "@/services/chat";

// Stable empty array — see use-conversation.ts for why this matters.
const NO_BOT_MESSAGES: DirectMessage[] = [];

interface UseBotChatParams {
  botUserId: string;
  currentUserId: string;
  enabled: boolean;
}

interface UseBotChatResult {
  messages: DirectMessage[];
  isLoading: boolean;
  sending: boolean;
  aiThinking: boolean;
  sendMessage: (content: string, imageUrl?: string | null) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

function newClientId(): string {
  return `local-${crypto.randomUUID?.() ?? Date.now().toString()}`;
}

function buildContext(
  history: DirectMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return history.slice(-10).map((m) => ({
    role: m.is_ai ? "assistant" : "user",
    content: m.content ?? "",
  }));
}

export function useBotChat({
  botUserId,
  currentUserId,
  enabled,
}: UseBotChatParams): UseBotChatResult {
  const messages = useChatStore(
    (s) => s.botConversations[botUserId] ?? NO_BOT_MESSAGES,
  );
  const appendBotMessage = useChatStore((s) => s.appendBotMessage);
  const removeBotMessage = useChatStore((s) => s.removeBotMessage);
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string | null) => {
      if (!enabled) return;
      const body = content.trim();
      if (!body && !imageUrl) return;
      if (sending || aiThinking) return;

      setSending(true);
      const userMsg: DirectMessage = {
        id: newClientId(),
        sender_id: currentUserId,
        receiver_id: botUserId,
        content: body,
        image_url: imageUrl ?? null,
        is_read: true,
        created_at: new Date().toISOString(),
        is_ai: false,
      };
      appendBotMessage(botUserId, userMsg);
      setSending(false);
      setAiThinking(true);

      try {
        const answer = await askAI(body, buildContext([...messages, userMsg]));
        const aiMsg: DirectMessage = {
          id: newClientId(),
          sender_id: AI_BOT_SENDER_ID,
          receiver_id: currentUserId,
          content: answer.answer,
          image_url: null,
          is_read: true,
          created_at: new Date().toISOString(),
          is_ai: true,
        };

        appendBotMessage(botUserId, aiMsg);
      } catch {
        toast.error("SyncBot is not responding, please try again later.");
      } finally {
        setAiThinking(false);
      }
    },
    [
      enabled,
      botUserId,
      currentUserId,
      messages,
      appendBotMessage,
      sending,
      aiThinking,
    ],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      removeBotMessage(botUserId, messageId);
    },
    [botUserId, removeBotMessage],
  );

  return {
    messages,
    isLoading: false,
    sending,
    aiThinking,
    sendMessage,
    deleteMessage,
  };
}
