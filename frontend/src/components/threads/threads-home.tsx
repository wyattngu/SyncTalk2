"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useThreads } from "@/hooks/use-threads";
import { useTags } from "@/hooks/use-tags";
import { useViewedThreads } from "@/hooks/use-viewed-threads";
import { useSemanticSearch } from "@/hooks/use-semantic-search";
import type { Thread } from "@/services/threads";
import { ThreadCard } from "./thread-card";

function ThreadsHomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const aiQuery = searchParams.get("q") ?? "";

  const { threads, isLoading, activeTag, removeFromList } = useThreads();
  const { tags } = useTags();
  const { isViewed, markViewed } = useViewedThreads();
  const aiSearch = useSemanticSearch(aiQuery);

  const [filter, setFilter] = useState("");

  const inAiMode = !!aiQuery.trim();
  const sourceThreads: Thread[] = inAiMode
    ? aiSearch.result?.threads ?? []
    : threads;

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sourceThreads;
    return sourceThreads.filter((t) => {
      const author = t.author?.username?.toLowerCase() ?? "";
      return (
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        author.includes(q)
      );
    });
  }, [sourceThreads, filter]);

  const ordered = useMemo<Thread[]>(() => {
    const unviewed = filtered.filter((t) => !isViewed(t.id));
    const viewed = filtered.filter((t) => isViewed(t.id));
    return [...unviewed, ...viewed];
  }, [filtered, isViewed]);

  const activeTagLabel = activeTag
    ? tags.find((t) => t.slug === activeTag)?.name
    : undefined;

  function clearAiSearch() {
    router.push("/");
  }

  return (
    <div className="mx-auto w-full px-6 py-8">
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            {inAiMode
              ? `Search: "${aiQuery}"`
              : activeTagLabel
              ? `#${activeTagLabel}`
              : "Latest Threads"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "thread" : "threads"} ·{" "}
            {tags.length} channels
          </p>
        </div>

        {isAuthenticated && (
          <Link href="/threads/new">
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Thread
            </button>
          </Link>
        )}
      </div>


      {/* AI insight panel */}
      {inAiMode && (
        <div className="mb-6 overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative flex items-start justify-between gap-3 p-5">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-fixed-dim opacity-30 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <span className="material-symbols-outlined icon-fill text-[20px]">
                  auto_awesome
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {aiSearch.loading
                    ? "AI is interpreting your query..."
                    : aiSearch.result?.used_ai
                    ? "AI Intent Analysis"
                    : "Keyword Search"}
                </p>
                {aiSearch.result && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {aiSearch.result.filters.keywords.map((kw) => (
                      <span
                        key={`k-${kw}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        <span className="material-symbols-outlined text-[14px]">search</span>
                        {kw}
                      </span>
                    ))}
                    {aiSearch.result.filters.tag_slugs.map((slug) => (
                      <span
                        key={`t-${slug}`}
                        className="inline-flex items-center rounded-lg bg-secondary-container px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-on-secondary-container"
                      >
                        #{slug}
                      </span>
                    ))}
                  </div>
                )}
                {aiSearch.error && (
                  <p className="mt-1.5 text-xs text-destructive">{aiSearch.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={clearAiSearch}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {sourceThreads.length > 0 && (
        <div className="relative mb-4">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground">
            search
          </span>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by title, content, or author..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter("")}
              aria-label="Clear filter"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      )}

      {/* Thread list */}
      <div className="flex flex-col gap-4">
        {(isLoading || (inAiMode && aiSearch.loading)) && (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!isLoading && !aiSearch.loading && ordered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <span className="material-symbols-outlined mb-2 text-[40px] text-muted-foreground/40">
              forum
            </span>
            <p className="text-sm font-medium text-foreground">
              {filter
                ? `No threads match "${filter}".`
                : inAiMode
                ? "No threads matched your search."
                : activeTag
                ? "No threads in this channel yet."
                : "No threads yet."}
            </p>
            {filter && (
              <button
                type="button"
                onClick={() => setFilter("")}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                Clear filter
              </button>
            )}
            {!filter && !inAiMode && isAuthenticated && (
              <Link href="/threads/new">
                <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Start the conversation
                </button>
              </Link>
            )}
          </div>
        )}

        {!isLoading &&
          !aiSearch.loading &&
          ordered.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isViewed={isViewed(thread.id)}
              tagLabel={activeTagLabel}
              onOpen={markViewed}
              onDeleted={removeFromList}
            />
          ))}
      </div>
    </div>
  );
}

export default ThreadsHomePage;
