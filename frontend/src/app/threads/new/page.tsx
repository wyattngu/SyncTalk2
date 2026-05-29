"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUploadButton from "@/components/chat/image-upload-button";
import { useAuthStore } from "@/lib/auth-store";
import { threadsService } from "@/services/threads";

/** Read a cookie by name from document.cookie (client-side only). */
function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

export default function NewThreadsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({ title: "", content: "" });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const next = { title: "", content: "" };
    if (title.trim().length < 5) next.title = "Title must be at least 5 characters";
    if (content.trim().length < 15) next.content = "Content must be at least 15 characters";
    setErrors(next);

    const isValid = !next.title && !next.content;
    if (!isValid) {
      toast.error("Validation failed", {
        description: "Please check the form for errors.",
      });
    }
    return isValid;
  }

  async function handleManualSubmit() {
    const token = getCookieValue("token");
    if (!token && !isAuthenticated) {
      toast.error("Authentication required", { description: "Please sign in to publish a thread." });
      router.push("/sign-in");
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const created = await threadsService.create({
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl || undefined,
      });

      if (!created || !created.id) {
        throw new Error("Server returned an unexpected response");
      }

      toast.success("Thread published", { description: "Your post is live." });
      router.push(`/threads/${created.id}`);
    } catch (err: any) {
      console.error("[NewThread] create failed:", err);
      const msg = err?.response?.data?.message || err?.message || "An unexpected error occurred";
      toast.error("Could not create thread", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto w-full px-6 py-8">
      <button
        onClick={() => router.push("/")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
      </button>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Start a new thread
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share what&apos;s on your mind with the SyncTalk community.
        </p>
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Title
          </label>
          <Input
            placeholder="A clear, descriptive title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Content
          </label>
          <Textarea
            rows={8}
            placeholder="Share your thoughts, questions, or ideas..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="material-symbols-outlined text-[14px]">code</span>
            Markdown supported — **bold**, _italic_, `code`, ```code blocks```, lists, links, tables.
          </p>
          {errors.content && (
            <p className="mt-1 text-xs text-destructive">{errors.content}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="material-symbols-outlined text-[14px]">image</span>
            Image (optional)
          </label>
          <ImageUploadButton
            variant="large"
            onImageUpload={setImageUrl}
            pendingImageUrl={imageUrl}
            onClearImage={() => setImageUrl(null)}
          />
        </div>

        <div className="relative z-[100] flex justify-end gap-2 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => router.push("/")}
            disabled={isSubmitting}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-container-low hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Publishing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                Publish thread
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
