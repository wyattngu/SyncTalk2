export const NotificationType = {
  MESSAGE: "message",
  FRIEND_REQUEST: "friend_request",
  FRIEND_ACCEPT: "friend_accept",
  REPLY: "reply",
  MENTION: "mention",
  REACTION: "reaction",
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];
