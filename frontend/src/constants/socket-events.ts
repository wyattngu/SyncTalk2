export const ServerEvents = {
  NEW_MESSAGE: "new_message",
  MESSAGES_READ: "messages_read",
  USER_TYPING: "user_typing",
  USER_STOP_TYPING: "user_stop_typing",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  NOTIFICATION_NEW: "notification:new",
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
  JOINED: "joined",
  ERROR: "error",
  ONLINE_COUNT: "online_count",
  USER_STATUS_CHANGE: "user_status_change",
} as const;

export type ServerEvent = (typeof ServerEvents)[keyof typeof ServerEvents];

export const ClientEvents = {
  JOIN: "join",
  LEAVE: "leave",
  SEND_MESSAGE: "send_message",
  TYPING: "typing",
  STOP_TYPING: "stop_typing",
  USER_DISCONNECT: "user_disconnect",
  AUTHENTICATE: "authenticate",
} as const;

export type ClientEvent = (typeof ClientEvents)[keyof typeof ClientEvents];

export interface NewMessagePayload {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  client_nonce?: string | null;
  is_ai?: boolean;
}

export interface TypingPayload {
  user_id: string;
  username?: string;
}

export interface UserPresencePayload {
  user_id: string;
}

export interface MessagesReadPayload {
  reader_id: string;
  sender_id: string;
}

export interface NotificationPayload {
  message?: string;
  type?: string;
  reference_id?: string | null;
}

export interface JoinPayload {
  token: string;
}

export interface SendMessageClientPayload {
  token: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  client_nonce?: string;
}

export interface TypingClientPayload {
  token: string;
  receiver_id: string;
}
