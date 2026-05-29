import browserClient from "@/lib/api-client";
import type { Thread } from "@/services/threads";

export interface ThreadSummary {
  thread_id: string;
  summary: string;
  key_points: string[];
  sentiment: "positive" | "neutral" | "mixed" | "negative";
  reply_count_at_generation: number;
  generated_at: string | null;
  is_stale: boolean;
}

export interface SemanticSearchResult {
  query: string;
  filters: {
    keywords: string[];
    tag_slugs: string[];
    intent: string;
  };
  used_ai: boolean;
  threads: Thread[];
}

export const aiService = {
  getSummary: async (threadId: string): Promise<ThreadSummary | null> => {
    const res = await browserClient.get(`/api/ai/threads/${threadId}/summary`);
    return res.data.data ?? null;
  },

  generateSummary: async (
    threadId: string,
    force = false
  ): Promise<ThreadSummary> => {
    const res = await browserClient.post(
      `/api/ai/threads/${threadId}/summarize${force ? "?force=true" : ""}`,
      {}
    );
    return res.data.data;
  },

  search: async (q: string): Promise<SemanticSearchResult> => {
    const res = await browserClient.get(
      `/api/ai/search?q=${encodeURIComponent(q)}`
    );
    return res.data.data;
  },
};
