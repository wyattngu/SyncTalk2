export const FriendshipStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
} as const;

export type FriendshipStatusValue =
  (typeof FriendshipStatus)[keyof typeof FriendshipStatus];

export const FriendRelation = {
  NONE: "none",
  PENDING_OUT: "pending_out",
  PENDING_IN: "pending_in",
  FRIENDS: "friends",
} as const;

export type FriendRelationValue =
  (typeof FriendRelation)[keyof typeof FriendRelation];
