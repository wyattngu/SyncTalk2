"use client";

import { useEffect, useRef, useState } from "react";

interface ThreadMenuProps {
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export function ThreadMenu({ canEdit, onEdit, onDelete, onShare }: ThreadMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function handle(action?: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      action?.();
    };
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Open thread menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground"
      >
        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {onShare && (
            <button
              type="button"
              role="menuitem"
              onClick={handle(onShare)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share
            </button>
          )}
          {canEdit && onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={handle(onEdit)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </button>
          )}
          {canEdit && onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={handle(onDelete)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive-soft"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
