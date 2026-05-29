"use client";

import { useCallback, useEffect, useState } from "react";
import {
  reactionsService,
  type ReactionGroup,
  type ReactionTargetType,
} from "@/services/reactions";
import { useAuthStore } from "@/lib/auth-store";

export function useReactions(targetType: ReactionTargetType, targetId: string) {
  const { user, isAuthenticated } = useAuthStore();
  const [reactions, setReactions] = useState<ReactionGroup[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let mounted = true;
    reactionsService
      .list(targetType, targetId)
      .then((list) => {
        if (mounted) setReactions(list);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, [targetType, targetId]);

  const toggle = useCallback(
    async (emoji: string) => {
      if (!isAuthenticated || pending) return;
      setPending(true);
      try {
        const res = await reactionsService.toggle(targetType, targetId, emoji);
        setReactions(res.reactions);
      } catch (err) {
        console.error("[useReactions] toggle", err);
      } finally {
        setPending(false);
      }
    },
    [isAuthenticated, pending, targetType, targetId]
  );

  const isReactedBy = useCallback(
    (emoji: string) => {
      if (!user) return false;
      const group = reactions.find((g) => g.emoji === emoji);
      return !!group?.user_ids.includes(user.id);
    },
    [reactions, user]
  );

  return { reactions, toggle, isReactedBy, pending };
}
