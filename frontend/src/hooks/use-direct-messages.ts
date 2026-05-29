"use client";

import { useCallback } from "react";
import { type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { useChatStore } from "@/lib/chat-store";
import { chatService, type DirectMessage } from "@/services/chat";
import { useBotChat } from "./use-bot-chat";
import { useConversation } from "./use-conversation";
import { useDirectMessageSender } from "./use-direct-message-sender";
import { useTypingIndicator } from "./use-typing-indicator";

interface UseDirectMessagesParams {
  otherUserId: string;
  isBotChat: boolean;
  socket: Socket | null;
  connected: boolean;
}

interface UseDirectMessagesResult {
  messages: DirectMessage[];
  isLoading: boolean;
  sending: boolean;
  aiThinking: boolean;
  typingLabel: string | null;
  sendMessage: (content: string, imageUrl?: string | null) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  emitTyping: () => void;
  emitStopTyping: () => void;
}

export function useDirectMessages({
  otherUserId,
  isBotChat,
  socket,
  connected,
}: UseDirectMessagesParams): UseDirectMessagesResult {
  const { user } = useAuthStore();
  const myId = user?.id ?? "";
  const removeInlineAIReply = useChatStore((s) => s.removeInlineAIReply);

  const conversation = useConversation({
    otherUserId,
    currentUserId: myId,
    socket,
    enabled: !isBotChat,
  });

  const sender = useDirectMessageSender({
    otherUserId,
    currentUserId: myId,
    token: useAuthStore((s) => s.token),
    socket,
    connected,
    appendOptimistic: conversation.appendOptimistic,
    removeOptimistic: conversation.removeMessage,
    knownMessages: conversation.messages,
    enabled: !isBotChat,
  });

  const bot = useBotChat({
    botUserId: otherUserId,
    currentUserId: myId,
    enabled: isBotChat,
  });

  const typing = useTypingIndicator({
    otherUserId,
    socket,
    enabled: !isBotChat,
  });

  const deleteHumanMessage = useCallback(
    async (id: string) => {
      try {
        await chatService.deleteMessage(id);
        conversation.removeMessage(id);
        removeInlineAIReply(otherUserId, id);
        toast.success("Message deleted");
      } catch (err) {
        console.error("[useDirectMessages] delete:", err);
        toast.error("Failed to delete message");
      }
    },
    [conversation, otherUserId, removeInlineAIReply],
  );

  if (isBotChat) {
    return {
      messages: bot.messages,
      isLoading: bot.isLoading,
      sending: bot.sending,
      aiThinking: bot.aiThinking,
      typingLabel: null,
      sendMessage: bot.sendMessage,
      deleteMessage: bot.deleteMessage,
      emitTyping: noop,
      emitStopTyping: noop,
    };
  }

  return {
    messages: conversation.messages,
    isLoading: conversation.isLoading,
    sending: sender.sending,
    aiThinking: sender.aiThinking,
    typingLabel: typing.typingLabel,
    sendMessage: sender.sendMessage,
    deleteMessage: deleteHumanMessage,
    emitTyping: typing.emitTyping,
    emitStopTyping: typing.emitStopTyping,
  };
}

function noop() {}
