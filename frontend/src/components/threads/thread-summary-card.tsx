"use client";

import { useState } from "react";
import { useThreadSummary } from "@/hooks/use-thread-summary";

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "bg-success-soft text-success",
  neutral: "bg-secondary-container text-on-secondary-container",
  mixed: "bg-primary-soft text-primary",
  negative: "bg-destructive-soft text-destructive",
};

interface ThreadSummaryCardProps {
  threadId: string;
  replyCount: number;
}

export function ThreadSummaryCard({ threadId, replyCount }: ThreadSummaryCardProps) {
  const { summary, loading, generating, error, regenerate, generateIfMissing } =
    useThreadSummary(threadId);
  const [expanded, setExpanded] = useState(true);

  if (replyCount < 2 && !summary) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface-container-low p-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="-m-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-card"
      >
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined icon-fill text-[20px]">
            auto_awesome
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">
            AI Summary
          </span>
          {summary?.is_stale && (
            <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-semibold text-on-secondary-container">
              update available
            </span>
          )}
        </div>
        <span className="material-symbols-outlined text-[20px] text-muted-foreground">
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4">
          {!summary && !loading && (
            <button
              onClick={generateIfMissing}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              <span className="material-symbols-outlined icon-fill text-[16px]">
                auto_awesome
              </span>
              {generating ? "Generating..." : "Generate summary"}
            </button>
          )}

          {summary && (
            <>
              <p className="text-base leading-relaxed text-muted-foreground">
                {summary.summary}
              </p>

              {summary.key_points.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {summary.key_points.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                      SENTIMENT_COLOR[summary.sentiment] ||
                      SENTIMENT_COLOR.neutral
                    }`}
                  >
                    {summary.sentiment}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    From {summary.reply_count_at_generation}{" "}
                    {summary.reply_count_at_generation === 1 ? "reply" : "replies"}
                  </span>
                </div>
                <button
                  onClick={regenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-primary disabled:opacity-60"
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      generating ? "animate-spin" : ""
                    }`}
                  >
                    refresh
                  </span>
                  {generating ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </>
          )}

          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
