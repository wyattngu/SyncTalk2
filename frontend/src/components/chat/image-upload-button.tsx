// src/components/chat/image-upload-button.tsx

"use client";

import browserClient from "@/lib/api-client";
import { apiPaths } from "@/constants";
import { ChangeEvent, useRef, useState } from "react";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

type ImageUploadBtnProps = {
  onImageUpload: (url: string) => void;
  pendingImageUrl?: string | null;
  onClearImage?: () => void;
  /**
   * 'icon'  — nút icon nhỏ gọn dùng trong chat (mặc định)
   * 'large' — vùng upload lớn dùng trong form đăng bài
   */
  variant?: "icon" | "large";
};

function ImageUploadButton({
  onImageUpload,
  pendingImageUrl,
  onClearImage,
  variant = "icon",
}: ImageUploadBtnProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleClick() {
    inputRef?.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await browserClient.post(apiPaths.UPLOAD_IMAGE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url: string | undefined = res.data?.data?.url;
      if (!url) throw new Error("Không nhận được URL ảnh");

      onImageUpload(url);
      toast.success("Tải ảnh thành công!");
    } catch (e) {
      console.error(e);
      toast.error("Tải ảnh thất bại", { description: "Vui lòng thử lại." });
    } finally {
      setUploading(false);
    }
  }

  /* ─── LARGE variant (dùng cho form đăng Thread) ──────────────────── */
  if (variant === "large") {
    return (
      <div className="w-full">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {pendingImageUrl ? (
          <div className="relative group overflow-hidden rounded-xl border border-border/60 shadow-sm transition-all hover:shadow-md">
            <img
              src={pendingImageUrl}
              alt="preview"
              className="max-h-80 w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                type="button"
                onClick={handleClick}
                disabled={uploading}
                title="Đổi ảnh"
                className="flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-105"
              >
                <ImageIcon className="size-4" />
              </button>
              {onClearImage && (
                <button
                  type="button"
                  onClick={onClearImage}
                  title="Xoá ảnh"
                  className="flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all hover:bg-red-500 hover:scale-105"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 bg-surface-container-low/40 py-12 transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-muted-foreground transition-all group-hover:bg-primary/10 group-hover:text-primary">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-foreground">
                {uploading ? "Đang tải ảnh lên..." : "Tải ảnh lên bài viết"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF, WEBP — tối đa 10 MB
              </p>
            </div>
          </button>
        )}
      </div>
    );
  }

  /* ─── ICON variant (dùng trong chat) ─────────────────────────────── */
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        title="Đính kèm ảnh"
        className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-surface-container-high/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-surface-container-high hover:text-foreground disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5" />
        )}
        <span>{uploading ? "Đang tải..." : "Ảnh"}</span>
      </button>
    </div>
  );
}

export default ImageUploadButton;
