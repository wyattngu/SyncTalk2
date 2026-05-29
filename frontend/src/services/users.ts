// src/services/users.ts

import browserClient from "@/lib/api-client";
import { apiPaths, type FriendRelationValue } from "@/constants";

export interface PublicProfile {
  id: string;
  username: string;
  profile_image_url: string | null;
  is_online: boolean;
  created_at: string;
  last_seen: string | null;
  thread_count: number;
  friend_count: number;
  friendship: {
    relation: FriendRelationValue | "self";
    request_id: string | null;
  };
  block: {
    is_blocked_by_me: boolean;
    is_blocked_by_them: boolean;
  };
  is_self: boolean;
  threads: {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    reply_count: number;
    like_count: number;
    created_at: string;
  }[];
}

export const usersService = {
  /**
   * GET /api/users/<id>/profile — full public profile, plus the viewer's
   * relationship state (friend, block) with the target so the UI can render
   * action buttons in one round-trip.
   */
  getPublicProfile: async (userId: string): Promise<PublicProfile> => {
    const res = await browserClient.get(apiPaths.userPublicProfile(userId));
    return res.data.data;
  },
};
