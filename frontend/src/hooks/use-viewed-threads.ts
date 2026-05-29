"use client";

import { useCallback, useEffect, useState } from "react";

const VIEWED_KEY = "synctalk_viewed_threads";

function readStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeStorage(ids: Set<string>) {
  try {
    localStorage.setItem(VIEWED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function useViewedThreads() {
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setViewedIds(readStorage());
  }, []);

  const markViewed = useCallback((id: string) => {
    setViewedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      writeStorage(next);
      return next;
    });
  }, []);

  const isViewed = useCallback((id: string) => viewedIds.has(id), [viewedIds]);

  return { viewedIds, isViewed, markViewed };
}
