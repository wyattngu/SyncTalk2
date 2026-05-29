"use client";

import { useCallback, useEffect, useState } from "react";
import { threadsService, type Thread } from "@/services/threads";

export function useThreads(initialTag: string | null = null) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(initialTag);

  const load = useCallback(async (tagSlug?: string | null) => {
    setIsLoading(true);
    try {
      const data = tagSlug
        ? await threadsService.listByTag(tagSlug)
        : await threadsService.list();
      setThreads(data);
    } catch (err) {
      console.error("[useThreads]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTag);
  }, [activeTag, load]);

  const selectTag = useCallback(
    (slug: string | null) => setActiveTag((prev) => (prev === slug ? null : slug)),
    []
  );

  const removeFromList = useCallback((id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const upsertInList = useCallback((updated: Thread) => {
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
  }, []);

  return {
    threads,
    isLoading,
    activeTag,
    selectTag,
    reload: () => load(activeTag),
    removeFromList,
    upsertInList,
  };
}
