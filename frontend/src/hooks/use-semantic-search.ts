"use client";

import { useEffect, useState } from "react";
import { aiService, type SemanticSearchResult } from "@/services/ai";

export function useSemanticSearch(query: string) {
  const [result, setResult] = useState<SemanticSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    aiService
      .search(query.trim())
      .then((r) => {
        if (mounted) setResult(r);
      })
      .catch((err) => {
        if (mounted)
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Search failed"
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [query]);

  return { result, loading, error };
}
