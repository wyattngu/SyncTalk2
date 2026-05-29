"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import {
  friendsService,
  type FriendshipSummary,
  type PendingBuckets,
} from "@/services/friends";

interface UseFriendsResult {
  friends: FriendshipSummary[];
  pending: PendingBuckets;
  loading: boolean;
  refresh: () => Promise<void>;
}

const EMPTY_PENDING: PendingBuckets = { incoming: [], outgoing: [] };

export function useFriends(): UseFriendsResult {
  const { isAuthenticated } = useAuthStore();
  const [friends, setFriends] = useState<FriendshipSummary[]>([]);
  const [pending, setPending] = useState<PendingBuckets>(EMPTY_PENDING);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setFriends([]);
      setPending(EMPTY_PENDING);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [friendsList, pendingBuckets] = await Promise.all([
        friendsService.list(),
        friendsService.listPending(),
      ]);
      setFriends(friendsList);
      setPending(pendingBuckets);
    } catch (err) {
      console.error("[useFriends]", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { friends, pending, loading, refresh };
}
