"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Socket } from "socket.io-client";
import { toast } from "sonner";
import {
  ServerEvents,
  type MessagesReadPayload,
  type NewMessagePayload,
} from "@/constants";
import { chatService, type DirectMessage } from "@/services/chat";
import { useChatStore } from "@/lib/chat-store";

// Stable empty array — `?? []` would create a fresh ref each render and trip
// React's "result of getSnapshot should be cached" warning, looping forever.
const NO_AI_REPLIES: DirectMessage[] = [];

interface UseConversationParams {
  otherUserId: string;
  currentUserId: string;
  socket: Socket | null;
  enabled: boolean;
}

interface UseConversationResult {
  messages: DirectMessage[];
  isLoading: boolean;
  appendOptimistic: (message: DirectMessage) => void;
  removeMessage: (messageId: string) => void;
}

export function useConversation({
  otherUserId,
  currentUserId,
  socket,
  enabled,
}: UseConversationParams): UseConversationResult {
  const [serverMessages, setServerMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const inlineAIReplies = useChatStore(
    (s) => s.inlineAIReplies[otherUserId] ?? NO_AI_REPLIES,
  );

  const markRead = useCallback(() => {
    if (!enabled || !otherUserId) return;
    chatService.markAsRead(otherUserId).catch((err) => {
      console.error("[useConversation.markRead]", err);
    });
  }, [enabled, otherUserId]);

  useEffect(() => {
    if (!enabled || !otherUserId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    chatService
      .getConversation(otherUserId)
      .then((history) => {
        if (cancelled) return;
        setServerMessages(history);
        markRead();
      })
      .catch((err) => console.error("[useConversation] load:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, otherUserId, markRead]);

  useEffect(() => {
    if (!enabled || !socket || !currentUserId) return;

    function handleNewMessage(payload: NewMessagePayload) {
      const isFromOther =
        payload.sender_id === otherUserId &&
        payload.receiver_id === currentUserId;
      const isFromMe =
        payload.sender_id === currentUserId &&
        payload.receiver_id === otherUserId;
      if (!isFromOther && !isFromMe) return;

      setServerMessages((prev) => {
        // Reconcile optimistic row by client_nonce (id is server-generated).
        if (payload.client_nonce) {
          const idx = prev.findIndex(
            (m) => m.pending && m.client_nonce === payload.client_nonce,
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...payload, pending: false };
            return next;
          }
        }
        if (prev.find((m) => m.id === payload.id)) return prev;
        return [...prev, { ...payload, pending: false }];
      });

      if (isFromOther) markRead();
    }

    function handleMessagesRead(payload: MessagesReadPayload) {
      if (payload.reader_id !== otherUserId) return;
      setServerMessages((prev) =>
        prev.map((m) =>
          m.sender_id === currentUserId &&
          m.receiver_id === otherUserId &&
          !m.is_read
            ? { ...m, is_read: true }
            : m,
        ),
      );
    }

    function handleSocketError(payload: { message?: string }) {
      const msg = payload?.message;
      if (!msg) return;
      // Drop any pending row this user just queued — backend rejected it.
      setServerMessages((prev) => prev.filter((m) => !m.pending));
      toast.error(msg);
    }

    socket.on(ServerEvents.NEW_MESSAGE, handleNewMessage);
    socket.on(ServerEvents.MESSAGES_READ, handleMessagesRead);
    socket.on(ServerEvents.ERROR, handleSocketError);
    return () => {
      socket.off(ServerEvents.NEW_MESSAGE, handleNewMessage);
      socket.off(ServerEvents.MESSAGES_READ, handleMessagesRead);
      socket.off(ServerEvents.ERROR, handleSocketError);
    };
  }, [enabled, socket, otherUserId, currentUserId, markRead]);

  const messages = useMemo(() => {
    if (inlineAIReplies.length === 0) return serverMessages;
    // Exclude optimistic entries whose real ID is already in serverMessages
    // (happens when the DB-persisted version loads on next fetch/reload)
    const serverIds = new Set(serverMessages.map((m) => m.id));
    const nonDup = inlineAIReplies.filter((m) => !serverIds.has(m.id));
    if (nonDup.length === 0) return serverMessages;
    return [...serverMessages, ...nonDup].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [serverMessages, inlineAIReplies]);

  const appendOptimistic = useCallback((message: DirectMessage) => {
    setServerMessages((prev) => [...prev, message]);
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setServerMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  return { messages, isLoading, appendOptimistic, removeMessage };
}
