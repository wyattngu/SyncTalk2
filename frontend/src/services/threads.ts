import browserClient from "@/lib/api-client";

export interface Thread {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author?: {
    id: string;
    username: string;
    profile_image_url: string | null;
  } | null;
  like_count: number;
  reply_count: number;
  is_pinned: boolean;
  created_at: string;
  image_url?: string;
  liked_by_me?: boolean;
  has_summary?: boolean;
}

export interface TagItem {
  id: string;
  name: string;
  slug: string;
}

export interface OnlineUser {
  id: string;
  username: string;
  is_online: boolean;
  last_seen: string;
}

export const threadsService = {
  list: async (): Promise<Thread[]> => {
    const res = await browserClient.get("/api/threads");
    return res.data.data ?? [];
  },
  mine: async (): Promise<Thread[]> => {
    const res = await browserClient.get("/api/threads/mine");
    return res.data.data ?? [];
  },
  listByTag: async (tagSlug: string): Promise<Thread[]> => {
    const res = await browserClient.get(`/api/tags/${tagSlug}/threads`);
    return res.data.data ?? [];
  },
  byId: async (id: string) => {
    const res = await browserClient.get(`/api/threads/${id}`);
    return res.data.data;
  },
  related: async (id: string): Promise<Thread[]> => {
    const res = await browserClient.get(`/api/threads/${id}/related`);
    return res.data.data ?? [];
  },
  create: async (payload: { title: string; content: string; tag_ids?: string[]; image_url?: string }) => {
    const res = await browserClient.post("/api/threads", payload);
    return res.data.data;
  },
  update: async (
    id: string,
    payload: { title?: string; content?: string; image_url?: string | null }
  ): Promise<Thread> => {
    const res = await browserClient.put(`/api/threads/${id}`, payload);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await browserClient.delete(`/api/threads/${id}`);
  },
  like: async (id: string) => {
    const res = await browserClient.post(`/api/threads/${id}/like`, {});
    return res.data.data as { like_count: number; liked: boolean };
  },
  unlike: async (id: string) => {
    const res = await browserClient.delete(`/api/threads/${id}/unlike`);
    return res.data.data as { like_count: number; liked: boolean };
  },
};

export const tagsService = {
  list: async (): Promise<TagItem[]> => {
    const res = await browserClient.get("/api/tags");
    return res.data.data ?? [];
  },
};

export const usersService = {
  withStatus: async (): Promise<OnlineUser[]> => {
    const res = await browserClient.get("/api/auth/users/online");
    return res.data.data ?? [];
  },
};
