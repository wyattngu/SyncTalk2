"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Socket } from "socket.io-client";
import { toast } from "sonner";
import browserClient, { askAI } from "@/lib/api-client";
import { useChatStore } from "@/lib/chat-store";
import {
  apiPaths,
  AI_BOT_SENDER_ID,
  ClientEvents,
  type SendMessageClientPayload,
} from "@/constants";
import type { DirectMessage } from "@/services/chat";

interface UseDirectMessageSenderParams {
  otherUserId: string;
  currentUserId: string;
  token: string | null;
  socket: Socket | null;
  connected: boolean;
  appendOptimistic: (message: DirectMessage) => void;
  removeOptimistic: (messageId: string) => void;
  knownMessages: DirectMessage[];
  enabled: boolean;
}

interface UseDirectMessageSenderResult {
  sending: boolean;
  aiThinking: boolean;
  sendMessage: (content: string, imageUrl?: string | null) => Promise<void>;
}

const SYNC_MENTION = "@sync";
const SEND_TIMEOUT_MS = 15000;

function newNonce(): string {
  return crypto.randomUUID?.() ?? `nonce-${Date.now()}-${Math.random()}`;
}

function buildContext(
  history: DirectMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return history.slice(-10).map((m) => ({
    role: m.is_ai ? "assistant" : "user",
    content: m.content ?? "",
  }));
}

export function useDirectMessageSender({
  otherUserId,
  currentUserId,
  token,
  socket,
  connected,
  appendOptimistic,
  removeOptimistic,
  knownMessages,
  enabled,
}: UseDirectMessageSenderParams): UseDirectMessageSenderResult {
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const appendInlineAIReply = useChatStore((s) => s.appendInlineAIReply);
  const updateInlineAIReplyId = useChatStore((s) => s.updateInlineAIReplyId);

  // Latest messages, accessible from inside async timers without going stale.
  const messagesRef = useRef(knownMessages);
  useEffect(() => {
    messagesRef.current = knownMessages;
  }, [knownMessages]);

  // Active send-watchdog timers, keyed by client_nonce.
  const pendingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    return () => {
      for (const t of pendingTimersRef.current.values()) clearTimeout(t);
      pendingTimersRef.current.clear();
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string | null) => {
      if (!enabled) return;
      const body = content.trim();
      if (!body && !imageUrl) return;
      if (sending || aiThinking) return;
      if (!socket || !connected || !token) {
        toast("Not connected", {
          description: "Realtime connection is not established yet.",
        });
        return;
      }

      setSending(true);
      const nonce = newNonce();
      const optimisticId = `pending-${nonce}`;

      const optimistic: DirectMessage = {
        id: optimisticId,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: body,
        image_url: imageUrl ?? null,
        is_read: false,
        created_at: new Date().toISOString(),
        pending: true,
        client_nonce: nonce,
      };
      appendOptimistic(optimistic);

      const payload: SendMessageClientPayload = {
        token,
        receiver_id: otherUserId,
        content: body || "",
        image_url: imageUrl || undefined,
        client_nonce: nonce,
      };
      socket.emit(ClientEvents.SEND_MESSAGE, payload);
      socket.emit(ClientEvents.STOP_TYPING, {
        token,
        receiver_id: otherUserId,
      });
      setSending(false);

      // Watchdog: if the server never echoes (old backend, network hiccup,
      // silent server error), drop the spinner and tell the user.
      const timer = setTimeout(() => {
        pendingTimersRef.current.delete(nonce);
        const reconciled = messagesRef.current.find(
          (m) => m.client_nonce === nonce && !m.pending,
        );
        if (reconciled) return;
        removeOptimistic(optimisticId);
        toast.error("Message could not be sent", {
          description:
            "The server didn't acknowledge your message. Please try again.",
        });
      }, SEND_TIMEOUT_MS);
      pendingTimersRef.current.set(nonce, timer);

      if (body.toLowerCase().includes(SYNC_MENTION)) {
        setAiThinking(true);
        try {
          const aiResponse = await askAI(
            body,
            buildContext(knownMessages),
            otherUserId,
          );
          // Persist the AI reply to the backend so it survives page reloads.
          // On success, the server echo comes back via getConversation on reload.
          // We also show it optimistically right now via appendInlineAIReply.
          const optimisticReply: DirectMessage = {
            id: `ai-${newNonce()}`,
            sender_id: AI_BOT_SENDER_ID,
            receiver_id: currentUserId,
            content: aiResponse.answer,
            image_url: null,
            is_read: true,
            created_at: new Date().toISOString(),
            is_ai: true,
          };
          appendInlineAIReply(otherUserId, optimisticReply);

          // Persist to DB so the reply survives reload. On success, swap the
          // optimistic ID for the real server ID so dedup works correctly when
          // serverMessages later includes the same row.
          try {
            const res = await browserClient.post(apiPaths.AI_REPLY, {
              content: aiResponse.answer,
              context_user_id: otherUserId,
            });
            const serverId = res.data?.data?.id;
            if (serverId) {
              updateInlineAIReplyId(otherUserId, optimisticReply.id, serverId);
            }
          } catch {
            // Non-critical: message still shows via localStorage persist
          }
        } catch {
          toast.error("SyncBot is not responding, please try again later.");
        } finally {
          setAiThinking(false);
        }
      }
    },
    [
      enabled,
      socket,
      connected,
      token,
      otherUserId,
      currentUserId,
      knownMessages,
      appendOptimistic,
      removeOptimistic,
      appendInlineAIReply,
      updateInlineAIReplyId,
      sending,
      aiThinking,
    ],
  );

  return { sending, aiThinking, sendMessage };
}
