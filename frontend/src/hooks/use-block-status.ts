"use client";

import { useEffect, useState } from "react";
import { chatService, type BlockStatus } from "@/services/chat";

interface UseBlockStatusParams {
  otherUserId: string;
  enabled: boolean;
}

interface UseBlockStatusResult {
  status: BlockStatus | null;
  isBlocked: boolean;
}

export function useBlockStatus({
  otherUserId,
  enabled,
}: UseBlockStatusParams): UseBlockStatusResult {
  const [status, setStatus] = useState<BlockStatus | null>(null);

  useEffect(() => {
    if (!enabled || !otherUserId) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    chatService
      .getBlockStatus(otherUserId)
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch((err) => console.error("[useBlockStatus]", err));

    return () => {
      cancelled = true;
    };
  }, [otherUserId, enabled]);

  const isBlocked =
    !!status?.is_blocked_by_me || !!status?.is_blocked_by_them;

  return { status, isBlocked };
}
