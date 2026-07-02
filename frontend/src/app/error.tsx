"use client";

// Error boundary tingkat-route. Tanpa ini, error render di sisi klien membuat
// Next.js menampilkan layar putih kosong (blank) tanpa pesan apa pun.
// Dengan ini, pengguna melihat pesan + tombol coba lagi alih-alih blank.
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Bantu diagnosa: error tetap tercatat di console browser walau UI ramah.
    console.error("Render error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-polks-bg px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-polks-surface text-2xl">
        ⚠️
      </div>
      <div>
        <p className="text-[15px] font-bold text-polks-text">Terjadi kesalahan</p>
        <p className="mt-1 text-[13px] text-polks-muted">
          Halaman gagal dimuat. Coba muat ulang.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-polks-brand px-5 py-2.5 text-[13px] font-semibold text-white"
      >
        Coba lagi
      </button>
    </div>
  );
}
