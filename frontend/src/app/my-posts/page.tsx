"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { threadsService, type Thread } from "@/services/threads";
import { ThreadCard } from "@/components/threads/thread-card";
import { useViewedThreads } from "@/hooks/use-viewed-threads";
import { Card, CardContent } from "@/components/ui/card";

export default function MyPostsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { markViewed } = useViewedThreads();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    let mounted = true;
    setLoading(true);
    threadsService
      .mine()
      .then((data) => {
        if (mounted) setThreads(data);
      })
      .catch((err) => {
        console.error("[my-posts]", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, router]);

  const handleDeleted = useCallback((id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="mx-auto w-full px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            My posts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading..."
              : `${threads.length} ${threads.length === 1 ? "thread" : "threads"} you've published`}
          </p>
        </div>

        <Link href="/threads/new">
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Thread
          </button>
        </Link>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading your posts...
          </CardContent>
        </Card>
      )}

      {!loading && threads.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="material-symbols-outlined mb-2 block text-[40px] text-muted-foreground/40">
              article
            </span>
            <p className="text-sm font-medium text-foreground">
              You haven&apos;t posted any threads yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click &quot;New Thread&quot; to share your first post.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && threads.length > 0 && (
        <div className="flex flex-col gap-4">
          {threads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isViewed={false}
              onOpen={markViewed}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
