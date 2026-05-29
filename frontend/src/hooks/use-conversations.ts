"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type Socket } from "socket.io-client";
import {
  ServerEvents,
  type MessagesReadPayload,
  type NewMessagePayload,
  type UserPresencePayload,
} from "@/constants";
import { useAuthStore } from "@/lib/auth-store";
import {
  chatService,
  type ConversationLastMessage,
  type ConversationSummary,
} from "@/services/chat";

interface UseConversationsParams {
  socket: Socket | null;
  activeUserId: string | null;
}

interface UseConversationsResult {
  conversations: ConversationSummary[];
  loading: boolean;
  onlineCount: number;
  totalUnread: number;
}

function previewFromPayload(
  payload: NewMessagePayload,
): ConversationLastMessage {
  return {
    id: payload.id,
    content: payload.content ?? null,
    image_url: payload.image_url ?? null,
    created_at: payload.created_at,
    sender_id: payload.sender_id,
    is_read: payload.is_read ?? false,
  };
}

function timeOf(c: ConversationSummary): number {
  return c.last_message ? new Date(c.last_message.created_at).getTime() : 0;
}

function compareForSidebar(
  a: ConversationSummary,
  b: ConversationSummary,
): number {
  const ta = timeOf(a);
  const tb = timeOf(b);
  if (ta !== tb) return tb - ta;
  return a.username.localeCompare(b.username);
}

export function useConversations({
  socket,
  activeUserId,
}: UseConversationsParams): UseConversationsResult {
  const { isAuthenticated, user } = useAuthStore();
  const myId = user?.id ?? null;
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setConversations([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    chatService
      .listConversations()
      .then((data) => {
        if (!cancelled) setConversations(data);
      })
      .catch((err) => console.error("[useConversations] load:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Reset the unread badge for the conversation the user is currently viewing.
  // The chat panel calls markAsRead behind the scenes, so this just keeps the
  // sidebar in sync without waiting for a backend round-trip.
  useEffect(() => {
    if (!activeUserId) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeUserId && c.unread_count > 0
          ? { ...c, unread_count: 0 }
          : c,
      ),
    );
  }, [activeUserId]);

  // Live updates: new_message bumps the conversation, presence flips dots.
  useEffect(() => {
    if (!socket || !myId) return;

    function handleNewMessage(payload: NewMessagePayload) {
      const otherId =
        payload.sender_id === myId ? payload.receiver_id : payload.sender_id;
      if (!otherId) return;
      const isIncoming = payload.sender_id !== myId;

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === otherId);
        if (!existing) return prev;
        const incrementUnread =
          isIncoming && activeUserId !== otherId;
        return prev.map((c) =>
          c.id === otherId
            ? {
                ...c,
                last_message: previewFromPayload(payload),
                unread_count: incrementUnread
                  ? c.unread_count + 1
                  : isIncoming
                    ? 0
                    : c.unread_count,
              }
            : c,
        );
      });
    }

    function handleMessagesRead(payload: MessagesReadPayload) {
      // The other side just read OUR messages — flip is_read on the preview
      // so any "Sent" indicator clears.
      if (payload.reader_id === myId) return;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== payload.reader_id) return c;
          if (!c.last_message || c.last_message.sender_id !== myId) return c;
          return {
            ...c,
            last_message: { ...c.last_message, is_read: true },
          };
        }),
      );
    }

    function handleOnline(p: UserPresencePayload) {
      setConversations((prev) =>
        prev.map((c) => (c.id === p.user_id ? { ...c, is_online: true } : c)),
      );
    }

    function handleOffline(p: UserPresencePayload) {
      setConversations((prev) =>
        prev.map((c) => (c.id === p.user_id ? { ...c, is_online: false } : c)),
      );
    }

    function handleStatusChange(p: { user_id: string; is_online: boolean }) {
      setConversations((prev) =>
        prev.map((c) => (c.id === p.user_id ? { ...c, is_online: p.is_online } : c)),
      );
    }

    socket.on(ServerEvents.NEW_MESSAGE, handleNewMessage);
    socket.on(ServerEvents.MESSAGES_READ, handleMessagesRead);
    socket.on(ServerEvents.USER_ONLINE, handleOnline);
    socket.on(ServerEvents.USER_OFFLINE, handleOffline);
    socket.on(ServerEvents.USER_STATUS_CHANGE, handleStatusChange);

    return () => {
      socket.off(ServerEvents.NEW_MESSAGE, handleNewMessage);
      socket.off(ServerEvents.MESSAGES_READ, handleMessagesRead);
      socket.off(ServerEvents.USER_ONLINE, handleOnline);
      socket.off(ServerEvents.USER_OFFLINE, handleOffline);
      socket.off(ServerEvents.USER_STATUS_CHANGE, handleStatusChange);
    };
  }, [socket, myId, activeUserId]);

  const sorted = useMemo(
    () => [...conversations].sort(compareForSidebar),
    [conversations],
  );

  const onlineCount = useMemo(
    () => conversations.filter((c) => c.is_online).length,
    [conversations],
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations],
  );

  return {
    conversations: sorted,
    loading,
    onlineCount,
    totalUnread,
  };
}
