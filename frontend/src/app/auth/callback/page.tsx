"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

// Tujuan redirect backend setelah OAuth Google berhasil:
//   {FRONTEND}/auth/callback?token=<jwt>   (atau ?error=... bila gagal)
// Alur ideal: akun (email) dibuat backend → di sini cek profil; kalau nomor HP
// belum ada (user baru) → arahkan ke /complete-profile, selain itu → /dashboard.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const token = sp.get("token");
    const error = sp.get("error");
    if (error || !token) {
      setFailed(true);
      const t = setTimeout(() => router.replace("/login"), 1800);
      return () => clearTimeout(t);
    }
    setToken(token);
    // Cek kelengkapan profil (punya nomor HP?) lalu arahkan.
    api<{ phone: string | null }>("/member/profile")
      .then((p) => {
        window.location.replace(p?.phone ? "/dashboard" : "/complete-profile");
      })
      .catch(() => {
        window.location.replace("/complete-profile");
      });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-polks-brand font-body">
      <div className="flex flex-col items-center gap-3 text-center">
        {failed ? (
          <>
            <p className="text-sm font-semibold text-white">Login Google gagal</p>
            <p className="text-xs text-white/50">Mengalihkan ke halaman login…</p>
          </>
        ) : (
          <>
            <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm text-white/70">Menyelesaikan login…</p>
          </>
        )}
      </div>
    </main>
  );
}
