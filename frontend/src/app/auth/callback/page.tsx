"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/api";

// Tujuan redirect backend setelah OAuth Google berhasil:
//   {FRONTEND}/auth/callback?token=<jwt>   (atau ?error=... bila gagal)
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
    // Full reload supaya AuthProvider membaca token & memuat profil dari awal.
    window.location.replace("/dashboard");
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
