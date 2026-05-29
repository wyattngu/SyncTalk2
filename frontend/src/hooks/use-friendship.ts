"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FriendRelation,
  type FriendRelationValue,
} from "@/constants";
import { friendsService, type RelationStatus } from "@/services/friends";

interface UseFriendshipParams {
  otherUserId: string | null;
  initial?: RelationStatus;
  enabled?: boolean;
}

interface UseFriendshipResult {
  relation: FriendRelationValue | "self";
  requestId: string | null;
  loading: boolean;
  acting: boolean;
  refresh: () => Promise<void>;
  sendRequest: () => Promise<void>;
  cancelRequest: () => Promise<void>;
  acceptRequest: () => Promise<void>;
  declineRequest: () => Promise<void>;
  unfriend: () => Promise<void>;
}

export function useFriendship({
  otherUserId,
  initial,
  enabled = true,
}: UseFriendshipParams): UseFriendshipResult {
  const [relation, setRelation] = useState<FriendRelationValue | "self">(
    initial?.relation ?? FriendRelation.NONE,
  );
  const [requestId, setRequestId] = useState<string | null>(
    initial?.request_id ?? null,
  );
  const [loading, setLoading] = useState(!initial && enabled);
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !otherUserId) return;
    setLoading(true);
    try {
      const r = await friendsService.getRelation(otherUserId);
      setRelation(r.relation);
      setRequestId(r.request_id);
    } catch (err) {
      console.error("[useFriendship.refresh]", err);
    } finally {
      setLoading(false);
    }
  }, [otherUserId, enabled]);

  useEffect(() => {
    if (!enabled || !otherUserId) {
      setLoading(false);
      return;
    }
    if (initial) {
      setRelation(initial.relation);
      setRequestId(initial.request_id);
      setLoading(false);
      return;
    }
    void refresh();
  }, [otherUserId, enabled, initial, refresh]);

  function withAction<T>(
    fn: () => Promise<T>,
    successMessage: string,
  ): () => Promise<void> {
    return async () => {
      if (!otherUserId || acting) return;
      setActing(true);
      try {
        await fn();
        toast.success(successMessage);
        await refresh();
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Something went wrong";
        toast.error(message);
      } finally {
        setActing(false);
      }
    };
  }

  const sendRequest = withAction(
    () => friendsService.sendRequest(otherUserId!),
    "Friend request sent",
  );

  const cancelRequest = withAction(async () => {
    if (!requestId) return;
    await friendsService.cancelRequest(requestId);
  }, "Friend request cancelled");

  const acceptRequest = withAction(async () => {
    if (!requestId) return;
    await friendsService.acceptRequest(requestId);
  }, "Friend request accepted");

  const declineRequest = withAction(async () => {
    if (!requestId) return;
    await friendsService.declineRequest(requestId);
  }, "Friend request declined");

  const unfriend = withAction(
    () => friendsService.unfriend(otherUserId!),
    "Removed from friends",
  );

  return {
    relation,
    requestId,
    loading,
    acting,
    refresh,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    unfriend,
  };
}
