"use client";

import { useCallback, useEffect, useState } from "react";
import browserClient from "@/lib/api-client";
import { repliesService, type Comment } from "@/services/replies";
import { threadsService } from "@/services/threads";

interface ThreadDetail {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author?: { id: string; username: string; profile_image_url?: string | null } | null;
  like_count: number;
  reply_count: number;
  is_pinned: boolean;
  created_at: string;
  image_url?: string;
  liked_by_me?: boolean;
  has_summary?: boolean;
}

export function useThreadDetail(threadId: string | undefined) {
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    let mounted = true;
    setLoading(true);
    Promise.all([
      browserClient.get(`/api/threads/${threadId}`),
      repliesService.list(threadId),
    ])
      .then(([threadRes, commentsList]) => {
        if (!mounted) return;
        const data: ThreadDetail = threadRes.data.data;
        setThread(data);
        setLikeCount(data.like_count);
        setIsLiked(!!data.liked_by_me);
        setComments(commentsList);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [threadId]);

  const addComment = useCallback(
    async (content: string) => {
      if (!threadId) return;
      const created = await repliesService.create(threadId, content);
      setComments((prev) => [...prev, created]);
    },
    [threadId]
  );

  const removeComment = useCallback(async (commentId: string) => {
    await repliesService.remove(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  const toggleLike = useCallback(async () => {
    if (!threadId) return;
    if (isLiked) {
      await repliesService.unlike(threadId);
      setIsLiked(false);
      setLikeCount((n) => Math.max(0, n - 1));
    } else {
      await repliesService.like(threadId);
      setIsLiked(true);
      setLikeCount((n) => n + 1);
    }
  }, [threadId, isLiked]);

  const updateThread = useCallback(
    async (payload: { title?: string; content?: string; image_url?: string | null }) => {
      if (!threadId) return null;
      const updated = await threadsService.update(threadId, payload);
      setThread((prev) => (prev ? { ...prev, ...updated } : prev));
      return updated;
    },
    [threadId]
  );

  const removeThread = useCallback(async () => {
    if (!threadId) return;
    await threadsService.remove(threadId);
  }, [threadId]);

  return {
    thread,
    comments,
    loading,
    likeCount,
    isLiked,
    addComment,
    removeComment,
    toggleLike,
    updateThread,
    removeThread,
  };
}
