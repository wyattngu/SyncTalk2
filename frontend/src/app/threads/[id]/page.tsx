"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MarkdownContent from "@/components/content/markdown-content";
import { ReactionBar } from "@/components/reactions/reaction-bar";
import { ThreadSummaryCard } from "@/components/threads/thread-summary-card";
import { ThreadDetailSidebar } from "@/components/threads/thread-detail-sidebar";
import { ThreadMenu } from "@/components/threads/thread-menu";
import { useAuthStore } from "@/lib/auth-store";
import { useThreadDetail } from "@/hooks/use-thread-detail";
import { ConfirmModal } from "@/components/ui/confirm-modal";

function formatRelative(iso: string): string {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return "just now";
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ThreadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();

  const {
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
  } = useThreadDetail(params.id);

  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);

  // Thread edit/delete state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteThreadOpen, setDeleteThreadOpen] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);

  // Open in edit mode if ?edit=1 is set and current user is the owner
  useEffect(() => {
    if (!thread || !user) return;
    if (searchParams.get("edit") === "1" && thread.author_id === user.id && !editMode) {
      setEditTitle(thread.title);
      setEditContent(thread.content);
      setEditMode(true);
    }
  }, [thread, user, searchParams, editMode]);

  function startEdit() {
    if (!thread) return;
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    if (searchParams.get("edit") === "1") {
      router.replace(`/threads/${params.id}`);
    }
  }

  async function saveEdit() {
    const title = editTitle.trim();
    const content = editContent.trim();
    if (title.length < 5) {
      toast.error("Title must be at least 5 characters");
      return;
    }
    if (content.length < 15) {
      toast.error("Content must be at least 15 characters");
      return;
    }
    setSavingEdit(true);
    try {
      await updateThread({ title, content });
      toast.success("Thread updated");
      setEditMode(false);
      if (searchParams.get("edit") === "1") {
        router.replace(`/threads/${params.id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not update thread");
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDeleteThread() {
    if (deletingThread) return;
    setDeletingThread(true);
    try {
      await removeThread();
      toast.success("Thread deleted");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete thread");
    } finally {
      setDeletingThread(false);
      setDeleteThreadOpen(false);
    }
  }

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const repliesRef = useRef<HTMLDivElement>(null);

  function scrollToReplies() {
    repliesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onAddComment() {
    const text = newComment.trim();
    if (text.length < 2) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to comment");
      return;
    }
    setPosting(true);
    try {
      await addComment(text);
      setNewComment("");
      toast.success("Reply posted");
    } catch (err) {
      console.error(err);
      toast.error("Could not post reply");
    } finally {
      setPosting(false);
    }
  }

  async function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      await onAddComment();
    }
  }

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  async function onDeleteComment(id: string) {
    setCommentToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDeleteComment() {
    if (commentToDelete) {
      setDeletingId(commentToDelete);
      try {
        await removeComment(commentToDelete);
        toast.success("Reply deleted");
      } catch (err) {
        console.error(err);
      } finally {
        setDeletingId(null);
        setCommentToDelete(null);
      }
    }
  }

  async function onToggleLike() {
    if (!isAuthenticated) {
      toast.error("Please sign in to like posts");
      return;
    }
    setLiking(true);
    try {
      await toggleLike();
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  }

  async function onShare() {
    if (!thread) return;
    const url = `${window.location.origin}/threads/${thread.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: thread.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: url });
    } catch {
      /* cancelled */
    }
  }

  if (loading) {
    return (
      <div className="flex h-full justify-center px-4 py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="mb-2 text-base font-semibold text-foreground">
          Thread not found
        </p>
        <p className="mb-4 text-sm text-muted-foreground">
          It may have been deleted or moved.
        </p>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to threads
        </button>
      </div>
    );
  }

  const authorName = thread.author?.username ?? "User";
  const authorId = thread.author?.id;
  const authorInitial = (authorName[0] ?? "U").toUpperCase();
  const isOwner = isAuthenticated && !!user && thread.author_id === user.id;

  const authorAvatar = authorId ? (
    <Link
      href={`/profile/${authorId}`}
      aria-label={`View ${authorName}'s profile`}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-brand text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
    >
      {authorInitial}
    </Link>
  ) : (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-brand text-sm font-bold text-primary-foreground">
      {authorInitial}
    </div>
  );

  const authorNameNode = authorId ? (
    <Link
      href={`/profile/${authorId}`}
      className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
    >
      {authorName}
    </Link>
  ) : (
    <p className="text-sm font-semibold text-foreground">{authorName}</p>
  );

  return (
    <div className="flex h-full">
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteComment}
        title="Delete reply?"
        description="This action will permanently remove your comment. It cannot be undone."
      />
      <ConfirmModal
        isOpen={deleteThreadOpen}
        onClose={() => setDeleteThreadOpen(false)}
        onConfirm={confirmDeleteThread}
        title="Delete this thread?"
        description="This action will permanently remove the thread and all its replies. It cannot be undone."
      />
      {/* Center column */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-full px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Threads
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold text-primary">#synctalk</span>
          </nav>

          {/* Title */}
          <h1 className="font-display mb-5 text-3xl font-bold leading-tight tracking-tight text-foreground md:text-[34px]">
            {thread.title}
            {thread.is_pinned && (
              <span className="ml-3 inline-flex -translate-y-1 items-center gap-1 rounded-full bg-primary-soft px-2 py-1 align-middle text-[11px] font-semibold uppercase tracking-wider text-primary">
                <span className="material-symbols-outlined text-[12px]">push_pin</span>
                Pinned
              </span>
            )}
          </h1>

          {/* AI Summary */}
          <ThreadSummaryCard
            threadId={thread.id}
            replyCount={comments.length}
          />

          {/* Original post — single contained card */}
          <article className="mb-8 overflow-hidden rounded-xl border border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                {authorAvatar}
                <div>
                  {authorNameNode}
                  <p className="text-xs text-muted-foreground">
                    Posted {formatRelative(thread.created_at)}
                  </p>
                </div>
              </div>
              <ThreadMenu
                canEdit={isOwner}
                onEdit={startEdit}
                onDelete={() => setDeleteThreadOpen(true)}
                onShare={() => onShare()}
              />
            </div>

            {/* Body — view mode or edit mode */}
            {editMode ? (
              <div className="space-y-3 px-6 py-5">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Thread title"
                  className="text-lg font-semibold"
                  disabled={savingEdit}
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Thread content (markdown supported)"
                  rows={8}
                  disabled={savingEdit}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={savingEdit}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-container-low disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
                  >
                    {savingEdit ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5">
                <div className="text-foreground">
                  <MarkdownContent>{thread.content}</MarkdownContent>
                </div>

                {thread.image_url && (
                  <div className="mt-4 flex max-h-[600px] justify-center overflow-hidden rounded-lg border border-border bg-surface-container-low">
                    <img
                      src={thread.image_url}
                      alt=""
                      className="max-h-[600px] w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card-muted px-6 py-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleLike}
                  disabled={liking}
                  aria-pressed={isLiked}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    isLiked
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-primary-soft hover:text-primary"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isLiked ? "icon-fill" : ""
                    }`}
                  >
                    thumb_up
                  </span>
                  <span className="tabular-nums">{likeCount}</span>
                </button>

                <button
                  onClick={() => {
                    composerRef.current?.focus();
                    scrollToReplies();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    chat_bubble_outline
                  </span>
                  Reply
                </button>

                <button
                  onClick={onShare}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  Share
                </button>
              </div>

              <ReactionBar targetType="thread" targetId={thread.id} />
            </div>
          </article>

          {/* Replies header */}
          <div ref={repliesRef} className="mb-4 flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-foreground">
              Replies
            </h2>
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {comments.length}
            </span>
          </div>

          {/* Replies list */}
          <div className="space-y-3">
            {comments.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <span className="material-symbols-outlined mb-2 text-[36px] text-muted-foreground/40">
                  forum
                </span>
                <p className="text-sm font-medium text-foreground">
                  No replies yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Be the first to share your thoughts.
                </p>
              </div>
            )}

            {comments.map((c) => {
              const mine = isAuthenticated && c.author_id === user?.id;
              const cAuthor = c.author?.username || "User";
              const cInitial = cAuthor[0].toUpperCase();
              const cAuthorId = c.author?.id ?? c.author_id;
              return (
                <div
                  key={c.id}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-border-strong"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {cAuthorId ? (
                        <Link
                          href={`/profile/${cAuthorId}`}
                          aria-label={`View ${cAuthor}'s profile`}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-brand text-xs font-bold text-primary-foreground transition-transform hover:scale-105"
                        >
                          {cInitial}
                        </Link>
                      ) : (
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-brand text-xs font-bold text-primary-foreground">
                          {cInitial}
                        </div>
                      )}
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        {cAuthorId ? (
                          <Link
                            href={`/profile/${cAuthorId}`}
                            className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {cAuthor}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-foreground">
                            {cAuthor}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelative(c.created_at)}
                        </span>
                        {mine && (
                          <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            you
                          </span>
                        )}
                      </div>
                    </div>
                    {mine && (
                      <button
                        onClick={() => onDeleteComment(c.id)}
                        disabled={deletingId === c.id}
                        aria-label="Delete reply"
                        title="Delete reply"
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive-soft hover:text-destructive"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="text-foreground">
                    <MarkdownContent>{c.content}</MarkdownContent>
                  </div>

                  <div className="mt-3">
                    <ReactionBar targetType="reply" targetId={c.id} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border bg-card-muted px-5 py-3">
              <span className="material-symbols-outlined text-[18px] text-primary">
                reply
              </span>
              <p className="text-sm font-semibold text-foreground">
                {isAuthenticated
                  ? `Reply as ${user?.username}`
                  : "Sign in to join the conversation"}
              </p>
            </div>

            <div className="flex gap-3 p-5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-brand text-xs font-bold text-primary-foreground">
                {(user?.username?.[0] ?? "U").toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <Textarea
                  ref={composerRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  rows={3}
                  placeholder={
                    isAuthenticated
                      ? "Share your thoughts... (Markdown supported)"
                      : "You need to sign in first"
                  }
                  disabled={!isAuthenticated || posting}
                  className="resize-none border-border bg-card text-sm focus-visible:ring-primary/30"
                />

                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    <kbd className="rounded border border-border bg-surface-container px-1 py-0.5 font-mono text-[10px]">
                      Ctrl
                    </kbd>
                    {" + "}
                    <kbd className="rounded border border-border bg-surface-container px-1 py-0.5 font-mono text-[10px]">
                      Enter
                    </kbd>
                    {" to send · Markdown supported"}
                  </p>

                  <div className="flex items-center gap-2">
                    {newComment && (
                      <button
                        type="button"
                        onClick={() => setNewComment("")}
                        disabled={posting}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-container hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={onAddComment}
                      disabled={posting || !newComment.trim() || !isAuthenticated}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      {posting ? "Posting..." : "Post reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <ThreadDetailSidebar
        threadId={thread.id}
        author={thread.author}
        threadCreatedAt={thread.created_at}
        comments={comments}
        viewerId={user?.id ?? null}
      />
    </div>
  );
}
