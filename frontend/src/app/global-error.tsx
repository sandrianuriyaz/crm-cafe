"use client";

// Error boundary terakhir — menangkap error yang lolos sampai root layout
// (mis. error di provider). Wajib me-render <html>/<body> sendiri karena ini
// menggantikan root layout saat aktif. Tanpa ini, error root = layar putih.
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global render error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#F6F8FA",
          color: "#25343F",
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Terjadi kesalahan</p>
        <p style={{ fontSize: 13, color: "#8A959D", margin: 0 }}>
          Aplikasi gagal dimuat. Coba muat ulang halaman.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "none",
            borderRadius: 9999,
            background: "#25343F",
            color: "#fff",
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
