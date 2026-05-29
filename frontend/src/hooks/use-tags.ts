"use client";

import { useEffect, useState } from "react";
import { tagsService, type TagItem } from "@/services/threads";

export function useTags() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    tagsService
      .list()
      .then((data) => {
        if (!cancelled) setTags(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { tags, isLoading };
}
