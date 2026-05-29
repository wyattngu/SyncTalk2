"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { threadsService, type Thread } from "@/services/threads";
import { useAuthStore } from "@/lib/auth-store";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ThreadMenu } from "./thread-menu";

interface ThreadCardProps {
  thread: Thread;
  isViewed: boolean;
  tagLabel?: string;
  onOpen: (id: string) => void;
  onDeleted?: (id: string) => void;
}

function timeAgo(iso: string): string {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return "just now";
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function ThreadCard({ thread, isViewed, tagLabel, onOpen, onDeleted }: ThreadCardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [liked, setLiked] = useState(!!thread.liked_by_me);
  const [likeCount, setLikeCount] = useState(thread.like_count);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const authorName = thread.author?.username ?? "User";
  const authorId = thread.author?.id;
  const initial = authorName[0].toUpperCase();
  const channelName = tagLabel ? `#${tagLabel}` : "#synctalk";
  const isOwner = !!user && user.id === thread.author_id;

  async function onConfirmDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await threadsService.remove(thread.id);
      toast.success("Thread deleted");
      onDeleted?.(thread.id);
    } catch (err) {
      console.error(err);
      toast.error("Could not delete thread");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function onToggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please sign in to like posts");
      return;
    }
    if (busy) return;
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    setBusy(true);
    try {
      const res = prevLiked
        ? await threadsService.unlike(thread.id)
        : await threadsService.like(thread.id);
      if (typeof res.like_count === "number") setLikeCount(res.like_count);
    } catch (err) {
      console.error(err);
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Could not update like");
    } finally {
      setBusy(false);
    }
  }

  async function onShare(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const url = `${window.location.origin}/threads/${thread.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: thread.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: url });
    } catch {
      /* user cancelled */
    }
  }

  function onEdit() {
    router.push(`/threads/${thread.id}?edit=1`);
  }

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-md ${
        isViewed ? "opacity-90" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {authorId ? (
            <Link
              href={`/profile/${authorId}`}
              aria-label={`View ${authorName}'s profile`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-brand text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              {initial}
            </Link>
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-brand text-sm font-bold text-primary-foreground">
              {initial}
            </div>
          )}
          <div>
            {authorId ? (
              <Link
                href={`/profile/${authorId}`}
                className="text-base font-semibold text-foreground transition-colors hover:text-primary"
              >
                {authorName}
              </Link>
            ) : (
              <p className="text-base font-semibold text-foreground">{authorName}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {timeAgo(thread.created_at)} in{" "}
              <span className="font-medium text-primary">{channelName}</span>
            </p>
          </div>
        </div>
        <ThreadMenu
          canEdit={isOwner}
          onEdit={onEdit}
          onDelete={() => setDeleteOpen(true)}
          onShare={() => onShare()}
        />
      </div>

      {/* Title */}
      <Link href={`/threads/${thread.id}`} onClick={() => onOpen(thread.id)} className="block">
        <h3 className="font-display text-xl font-semibold leading-tight text-foreground transition-colors hover:text-primary">
          {thread.title}
        </h3>
      </Link>

      {/* Optional AI summary badge — only when summary exists */}
      {thread.has_summary && (
        <div className="flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          AI summary available
        </div>
      )}

      {/* Snippet */}
      <Link href={`/threads/${thread.id}`} onClick={() => onOpen(thread.id)} className="block">
        <p className="line-clamp-2 text-base leading-relaxed text-muted-foreground">
          {thread.content}
        </p>
      </Link>

      {/* Image preview if any */}
      {thread.image_url && (
        <Link
          href={`/threads/${thread.id}`}
          onClick={() => onOpen(thread.id)}
          className="mt-1 flex max-h-96 justify-center overflow-hidden rounded-lg border border-border bg-surface-container-low"
        >
          <img
            src={thread.image_url}
            alt=""
            className="max-h-96 w-auto object-contain"
          />
        </Link>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLike}
            disabled={busy}
            aria-pressed={liked}
            className={`flex items-center gap-1.5 transition-colors ${
              liked ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${liked ? "icon-fill" : ""}`}
            >
              thumb_up
            </span>
            <span className="text-sm font-semibold tabular-nums">{likeCount}</span>
          </button>

          <Link
            href={`/threads/${thread.id}`}
            onClick={() => onOpen(thread.id)}
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
            <span className="text-sm font-semibold">
              {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
            </span>
          </Link>

          <button
            onClick={onShare}
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            <span className="text-sm font-semibold">Share</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
        title="Delete this thread?"
        description="This action will permanently remove the thread and all its replies. It cannot be undone."
      />
    </article>
  );
}
