export const apiPaths = {
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  PROFILE: "/api/auth/profile",
  USERS: "/api/auth/users",
  USERS_ONLINE: "/api/auth/users/online",

  conversation: (otherUserId: string) => `/api/messages/${otherUserId}`,
  message: (messageId: string) => `/api/messages/${messageId}`,
  MESSAGES_UNREAD: "/api/messages/unread",
  CONVERSATIONS: "/api/messages/conversations",
  markRead: (senderId: string) => `/api/messages/read/${senderId}`,

  userBlockStatus: (userId: string) => `/api/users/${userId}/status`,
  userPublicProfile: (userId: string) => `/api/users/${userId}/profile`,
  blockUser: (userId: string) => `/api/users/${userId}/block`,
  unblockUser: (userId: string) => `/api/users/${userId}/unblock`,
  USERS_BLOCKED: "/api/users/blocked",

  FRIENDS: "/api/friends",
  FRIEND_REQUESTS: "/api/friends/requests",
  FRIENDS_PENDING: "/api/friends/pending",
  friendAccept: (requestId: string) =>
    `/api/friends/requests/${requestId}/accept`,
  friendDecline: (requestId: string) =>
    `/api/friends/requests/${requestId}/decline`,
  friendCancel: (requestId: string) => `/api/friends/requests/${requestId}`,
  unfriend: (userId: string) => `/api/friends/${userId}`,
  friendStatus: (userId: string) => `/api/friends/status/${userId}`,

  AI_CHAT: "/api/ai/chat",
  AI_REPLY: "/api/messages/ai-reply",

  NOTIFICATIONS: "/api/notifications",
  NOTIFICATIONS_UNREAD: "/api/notifications/unread",

  UPLOAD_IMAGE: "/api/upload/image-upload",

  THREADS: "/api/threads",
  TAGS: "/api/tags",

  REACTIONS: "/api/reactions",
  REACTIONS_ALLOWED: "/api/reactions/allowed",
} as const;
