// src/services/chat.ts

import browserClient from "@/lib/api-client";
import { apiPaths } from "@/constants";

export interface ChatUser {
  id: string;
  username: string;
  is_online: boolean;
  profile_image_url?: string | null;
  last_seen?: string | null;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  edited_at?: string | null;
  /** True only for AI bot messages (kept in memory). */
  is_ai?: boolean;
  /** True while the message is shown optimistically and has not yet been
   *  acknowledged by the server. Replaced once the server echoes the row. */
  pending?: boolean;
  /** Client-generated id used to reconcile the optimistic row with the server
   *  echo. Set on outbound `send_message` and echoed back by the server. */
  client_nonce?: string | null;
}

export interface BlockStatus {
  is_blocked_by_me: boolean;
  is_blocked_by_them: boolean;
}

export interface ConversationLastMessage {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  sender_id: string;
  is_read: boolean;
}

export interface ConversationSummary {
  id: string;
  username: string;
  profile_image_url: string | null;
  is_online: boolean;
  last_message: ConversationLastMessage | null;
  unread_count: number;
  last_seen?: string | null;
}

export const chatService = {
  /** GET /api/auth/users — list of users for the chat sidebar. */
  listUsers: async (): Promise<ChatUser[]> => {
    const res = await browserClient.get(apiPaths.USERS);
    return res.data.data ?? [];
  },

  listConversations: async (): Promise<ConversationSummary[]> => {
    const res = await browserClient.get(apiPaths.CONVERSATIONS);
    return res.data.data ?? [];
  },

  /**
   * GET /api/messages/<otherUserId>
   * Conversation history between current user and the other user.
   */
  getConversation: async (otherUserId: string): Promise<DirectMessage[]> => {
    const res = await browserClient.get(apiPaths.conversation(otherUserId));
    return res.data.data ?? [];
  },

  /** DELETE /api/messages/<id> — delete one of your own messages. */
  deleteMessage: async (messageId: string): Promise<void> => {
    await browserClient.delete(apiPaths.message(messageId));
  },

  /**
   * PUT /api/messages/read/<senderId> — mark all messages from `senderId`
   * to the current user as read. Backend additionally emits a
   * `messages_read` socket event to `senderId` so their FE can flip the
   * `is_read` flag on outgoing bubbles and render the "Seen" indicator.
   */
  markAsRead: async (senderId: string): Promise<void> => {
    await browserClient.put(apiPaths.markRead(senderId));
  },

  /** GET /api/users/<id>/status — block / blocked-by status. */
  getBlockStatus: async (otherUserId: string): Promise<BlockStatus> => {
    const res = await browserClient.get(apiPaths.userBlockStatus(otherUserId));
    return res.data.data;
  },

  blockUser: async (otherUserId: string): Promise<void> => {
    await browserClient.post(apiPaths.blockUser(otherUserId));
  },

  unblockUser: async (otherUserId: string): Promise<void> => {
    await browserClient.post(apiPaths.unblockUser(otherUserId));
  },
};

// Re-exported for backwards compatibility with existing imports.
export { isBotUsername } from "@/constants";
