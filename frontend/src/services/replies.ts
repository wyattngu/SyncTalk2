import browserClient from "@/lib/api-client";

export interface Comment {
  id: string;
  thread_id: string;
  author_id: string;
  author?: { id: string; username: string };
  content: string;
  created_at: string;
}

export const repliesService = {
  list: async (threadId: string): Promise<Comment[]> => {
    const res = await browserClient.get(`/api/threads/${threadId}/replies`);
    return res.data.data ?? [];
  },
  create: async (threadId: string, content: string): Promise<Comment> => {
    const res = await browserClient.post(`/api/threads/${threadId}/replies`, { content });
    return res.data.data;
  },
  remove: async (commentId: string) => {
    await browserClient.delete(`/api/threads/replies/${commentId}`);
  },
  like: async (threadId: string) => {
    await browserClient.post(`/api/threads/${threadId}/like`, {});
  },
  unlike: async (threadId: string) => {
    await browserClient.delete(`/api/threads/${threadId}/unlike`);
  },
};
