"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { threadsService, type Thread } from "@/services/threads";
import type { Comment } from "@/services/replies";

interface Author {
  id: string;
  username: string;
  profile_image_url?: string | null;
}

interface ThreadDetailSidebarProps {
  threadId: string;
  author: Author | null | undefined;
  threadCreatedAt: string;
  comments: Comment[];
  viewerId?: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ThreadDetailSidebar({
  threadId,
  author,
  threadCreatedAt,
  comments,
  viewerId,
}: ThreadDetailSidebarProps) {
  const isSelf = !!author && !!viewerId && author.id === viewerId;
  const [related, setRelated] = useState<Thread[] | null>(null);

  useEffect(() => {
    let mounted = true;
    threadsService
      .related(threadId)
      .then((list) => {
        if (mounted) setRelated(list);
      })
      .catch(() => {
        if (mounted) setRelated([]);
      });
    return () => {
      mounted = false;
    };
  }, [threadId]);

  const participants = useMemo(() => {
    const map = new Map<string, { username: string; count: number }>();
    if (author) map.set(author.id, { username: author.username, count: 0 });
    for (const c of comments) {
      const u = c.author?.username;
      if (!u || !c.author) continue;
      const prev = map.get(c.author.id);
      map.set(c.author.id, {
        username: u,
        count: (prev?.count ?? 0) + 1,
      });
    }
    return [...map.entries()].map(([id, info]) => ({ id, ...info }));
  }, [comments, author]);

  return (
    <aside className="hidden h-full w-80 shrink-0 overflow-y-auto border-l border-border bg-card lg:block">
      <div className="space-y-8 p-8">
        {/* Thread meta */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            About this thread
          </h3>
          <dl className="space-y-2 text-sm text-foreground">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(threadCreatedAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Replies</dt>
              <dd className="font-medium">{comments.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-semibold text-primary">Active discussion</dd>
            </div>
          </dl>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Participants ({participants.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {participants.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  title={`${p.username} · ${p.count} ${p.count === 1 ? "reply" : "replies"}`}
                  className="grid h-9 w-9 place-items-center rounded-full gradient-brand text-xs font-bold text-primary-foreground transition-transform hover:scale-110"
                >
                  {p.username[0].toUpperCase()}
                </Link>
              ))}
              {participants.length > 8 && (
                <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-container text-xs font-semibold text-muted-foreground">
                  +{participants.length - 8}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Related threads
          </h3>

          {related === null && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5 rounded-lg border border-border p-3">
                  <div className="h-3.5 w-full animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                </div>
              ))}
            </div>
          )}

          {related && related.length === 0 && (
            <p className="text-sm text-muted-foreground">No related threads yet.</p>
          )}

          {related && related.length > 0 && (
            <div className="space-y-3">
              {related.map((t) => (
                <Link
                  key={t.id}
                  href={`/threads/${t.id}`}
                  className="group block rounded-lg border border-border p-3 transition-colors hover:border-primary"
                >
                  <h4 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {t.title}
                  </h4>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.author?.username ?? "User"} · {t.reply_count}{" "}
                    {t.reply_count === 1 ? "reply" : "replies"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* DM author CTA — hidden when viewing your own thread */}
        {author && !isSelf && (
          <Link
            href={`/chat?userId=${author.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-container-low py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            Message {author.username}
          </Link>
        )}
      </div>
    </aside>
  );
}
