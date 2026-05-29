import browserClient from "@/lib/api-client";

export interface ReactionGroup {
  emoji: string;
  count: number;
  user_ids: string[];
}

export type ReactionTargetType = "thread" | "reply";

export const reactionsService = {
  list: async (
    targetType: ReactionTargetType,
    targetId: string
  ): Promise<ReactionGroup[]> => {
    const res = await browserClient.get(
      `/api/reactions?target_type=${targetType}&target_id=${targetId}`
    );
    return res.data.data ?? [];
  },

  toggle: async (
    targetType: ReactionTargetType,
    targetId: string,
    emoji: string
  ): Promise<{
    toggle: { state: "added" | "removed"; emoji: string };
    reactions: ReactionGroup[];
  }> => {
    const res = await browserClient.post("/api/reactions", {
      target_type: targetType,
      target_id: targetId,
      emoji,
    });
    return res.data.data;
  },

  allowedEmojis: async (): Promise<string[]> => {
    const res = await browserClient.get("/api/reactions/allowed");
    return res.data.data ?? [];
  },
};
