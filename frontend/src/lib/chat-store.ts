import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DirectMessage } from "@/services/chat";
import { useAuthStore } from "./auth-store";

interface ChatState {
  botConversations: Record<string, DirectMessage[]>;
  inlineAIReplies: Record<string, DirectMessage[]>;

  setBotConversation: (botUserId: string, messages: DirectMessage[]) => void;
  appendBotMessage: (botUserId: string, message: DirectMessage) => void;
  removeBotMessage: (botUserId: string, messageId: string) => void;

  appendInlineAIReply: (otherUserId: string, message: DirectMessage) => void;
  removeInlineAIReply: (otherUserId: string, messageId: string) => void;
  updateInlineAIReplyId: (otherUserId: string, oldId: string, newId: string) => void;

  clear: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      botConversations: {},
      inlineAIReplies: {},

      setBotConversation: (botUserId, messages) =>
        set((s) => ({
          botConversations: { ...s.botConversations, [botUserId]: messages },
        })),

      appendBotMessage: (botUserId, message) =>
        set((s) => {
          const existing = s.botConversations[botUserId] ?? [];
          if (existing.find((m) => m.id === message.id)) return s;
          return {
            botConversations: {
              ...s.botConversations,
              [botUserId]: [...existing, message],
            },
          };
        }),

      removeBotMessage: (botUserId, messageId) =>
        set((s) => {
          const existing = s.botConversations[botUserId];
          if (!existing) return s;
          return {
            botConversations: {
              ...s.botConversations,
              [botUserId]: existing.filter((m) => m.id !== messageId),
            },
          };
        }),

      appendInlineAIReply: (otherUserId, message) =>
        set((s) => {
          const existing = s.inlineAIReplies[otherUserId] ?? [];
          if (existing.find((m) => m.id === message.id)) return s;
          return {
            inlineAIReplies: {
              ...s.inlineAIReplies,
              [otherUserId]: [...existing, message],
            },
          };
        }),

      removeInlineAIReply: (otherUserId, messageId) =>
        set((s) => {
          const existing = s.inlineAIReplies[otherUserId];
          if (!existing) return s;
          return {
            inlineAIReplies: {
              ...s.inlineAIReplies,
              [otherUserId]: existing.filter((m) => m.id !== messageId),
            },
          };
        }),

      updateInlineAIReplyId: (otherUserId, oldId, newId) =>
        set((s) => {
          const existing = s.inlineAIReplies[otherUserId];
          if (!existing) return s;
          return {
            inlineAIReplies: {
              ...s.inlineAIReplies,
              [otherUserId]: existing.map((m) =>
                m.id === oldId ? { ...m, id: newId } : m,
              ),
            },
          };
        }),

      clear: () => set({ botConversations: {}, inlineAIReplies: {} }),
    }),
    {
      name: "synctalk-chat",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as unknown as Storage)
      ),
      partialize: (state) => ({
        inlineAIReplies: state.inlineAIReplies,
        botConversations: state.botConversations,
      }),
    },
  ),
);

// Wipe cached chat state when the signed-in user changes so user A's bot
// history can't bleed into user B's session on the same tab.
let lastUserId: string | null = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const currentUserId = state.user?.id ?? null;
  if (lastUserId !== currentUserId) {
    useChatStore.getState().clear();
    lastUserId = currentUserId;
  }
});
