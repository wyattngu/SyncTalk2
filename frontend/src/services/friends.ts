// src/services/friends.ts

import browserClient from "@/lib/api-client";
import {
  apiPaths,
  FriendRelation,
  type FriendRelationValue,
  type FriendshipStatusValue,
} from "@/constants";

export interface FriendUserSummary {
  id: string;
  username: string;
  profile_image_url: string | null;
  is_online: boolean;
}

export interface FriendshipSummary {
  request_id: string;
  status: FriendshipStatusValue;
  created_at: string;
  user: FriendUserSummary;
}

export interface PendingFriendship extends FriendshipSummary {
  /** "in" — they sent it; "out" — current user sent it. */
  direction: "in" | "out";
}

export interface PendingBuckets {
  incoming: PendingFriendship[];
  outgoing: PendingFriendship[];
}

export interface RelationStatus {
  /** "self" only when current user is viewing their own profile. */
  relation: FriendRelationValue | "self";
  /** Set when there's a row to act on (pending or accepted). */
  request_id: string | null;
}

export const friendsService = {
  /** Send a friend request to another user. */
  sendRequest: async (
    addresseeId: string,
  ): Promise<{ request_id: string; status: FriendshipStatusValue }> => {
    const res = await browserClient.post(apiPaths.FRIEND_REQUESTS, {
      user_id: addresseeId,
    });
    return res.data.data;
  },

  acceptRequest: async (requestId: string): Promise<void> => {
    await browserClient.post(apiPaths.friendAccept(requestId));
  },

  declineRequest: async (requestId: string): Promise<void> => {
    await browserClient.post(apiPaths.friendDecline(requestId));
  },

  cancelRequest: async (requestId: string): Promise<void> => {
    await browserClient.delete(apiPaths.friendCancel(requestId));
  },

  unfriend: async (otherUserId: string): Promise<void> => {
    await browserClient.delete(apiPaths.unfriend(otherUserId));
  },

  list: async (): Promise<FriendshipSummary[]> => {
    const res = await browserClient.get(apiPaths.FRIENDS);
    return res.data.data ?? [];
  },

  listPending: async (): Promise<PendingBuckets> => {
    const res = await browserClient.get(apiPaths.FRIENDS_PENDING);
    return res.data.data ?? { incoming: [], outgoing: [] };
  },

  getRelation: async (otherUserId: string): Promise<RelationStatus> => {
    const res = await browserClient.get(apiPaths.friendStatus(otherUserId));
    return (
      res.data.data ?? {
        relation: FriendRelation.NONE,
        request_id: null,
      }
    );
  },
};
