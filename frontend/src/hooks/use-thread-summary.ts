"use client";

import { useCallback, useEffect, useState } from "react";
import { aiService, type ThreadSummary } from "@/services/ai";

export function useThreadSummary(threadId: string | undefined) {
  const [summary, setSummary] = useState<ThreadSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) return;
    let mounted = true;
    setLoading(true);
    aiService
      .getSummary(threadId)
      .then((s) => {
        if (mounted) setSummary(s);
      })
      .catch(() => {
        // Read endpoint never errors loud — just treat as no summary
        if (mounted) setSummary(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [threadId]);

  const regenerate = useCallback(async () => {
    if (!threadId) return;
    setGenerating(true);
    setError(null);
    try {
      const fresh = await aiService.generateSummary(threadId, true);
      setSummary(fresh);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate summary";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }, [threadId]);

  const generateIfMissing = useCallback(async () => {
    if (summary || !threadId || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const fresh = await aiService.generateSummary(threadId, false);
      setSummary(fresh);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to generate summary"
      );
    } finally {
      setGenerating(false);
    }
  }, [summary, threadId, generating]);

  return { summary, loading, generating, error, regenerate, generateIfMissing };
}
