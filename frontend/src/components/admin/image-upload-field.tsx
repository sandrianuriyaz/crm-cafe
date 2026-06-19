"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/api";

// Upload gambar (16:9) ke Supabase Storage lewat backend, lalu balas URL ke parent.
export function ImageUploadField({
  value,
  onChange,
  folder,
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onPick}
      />

      {value ? (
        <div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Pratinjau gambar"
              className="aspect-[16/9] w-full rounded-xl border border-polks-border object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Hapus gambar"
              className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-2 w-full rounded-xl border border-polks-border py-2 text-xs font-semibold text-polks-brand disabled:opacity-60"
          >
            {uploading ? "Mengunggah…" : "Ganti Gambar"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-polks-border text-polks-muted disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Upload size={20} />
          )}
          <span className="px-3 text-center text-xs font-medium">
            {uploading ? "Mengunggah…" : "Upload gambar (rasio 16:9, maks 2 MB)"}
          </span>
        </button>
      )}

      {error ? <p className="mt-1 text-[11px] text-polks-error">{error}</p> : null}
    </div>
  );
}
