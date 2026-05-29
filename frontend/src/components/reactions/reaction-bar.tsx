"use client";

import { useState, useRef, useEffect } from "react";
import { SmilePlus } from "lucide-react";
import { useReactions } from "@/hooks/use-reactions";
import type { ReactionTargetType } from "@/services/reactions";

const EMOJIS = ["👍", "❤️", "🎉", "🤔", "😄", "🚀"];

interface ReactionBarProps {
  targetType: ReactionTargetType;
  targetId: string;
}

export function ReactionBar({ targetType, targetId }: ReactionBarProps) {
  const { reactions, toggle, isReactedBy, pending } = useReactions(
    targetType,
    targetId
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (pickerOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = () => setPickerOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [pickerOpen]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reactions.map((group) => {
        const mine = isReactedBy(group.emoji);
        return (
          <button
            key={group.emoji}
            onClick={() => toggle(group.emoji)}
            disabled={pending}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
              mine
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary-soft/50"
            }`}
          >
            <span className="text-sm leading-none">{group.emoji}</span>
            <span className="font-medium">{group.count}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => setPickerOpen((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
          aria-label="Add reaction"
        >
          <SmilePlus size={14} />
        </button>

        {pickerOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setPickerOpen(false)}
              aria-label="Close picker"
            />
            <div
              className="fixed z-40 flex gap-1 rounded-xl border border-border bg-card p-2 shadow-lg"
              style={{ top: pickerPos.top, left: pickerPos.left }}
            >
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    toggle(e);
                    setPickerOpen(false);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-md text-lg transition-transform hover:scale-110 hover:bg-secondary"
                  aria-label={`React with ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
