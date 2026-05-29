"use client";

import Link from "next/link";
import { Hash, Plus, Tag } from "lucide-react";
import type { TagItem } from "@/services/threads";

interface TagsSidebarProps {
  tags: TagItem[];
  activeTag: string | null;
  onSelect: (slug: string | null) => void;
  isAuthenticated: boolean;
}

export function TagsSidebar({ tags, activeTag, onSelect, isAuthenticated }: TagsSidebarProps) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 space-y-1">
        <p className="mb-2 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Tag size={11} />
          Topics
        </p>

        <button
          onClick={() => onSelect(null)}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            !activeTag
              ? "bg-primary-soft text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Hash size={14} />
          All threads
        </button>

        {tags.map((tag) => {
          const active = activeTag === tag.slug;
          return (
            <button
              key={tag.id}
              onClick={() => onSelect(tag.slug)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Hash size={14} />
              {tag.name}
            </button>
          );
        })}

        {isAuthenticated && (
          <Link href="/threads/new" className="block pt-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg gradient-brand px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md">
              <Plus size={15} />
              New thread
            </button>
          </Link>
        )}
      </div>
    </aside>
  );
}
