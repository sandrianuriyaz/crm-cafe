"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

type State = "idle" | "loading" | "success";

function ResetPasswordForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const token        = params.get("token") ?? "";

  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state,        setState]        = useState<State>("idle");
  const [error,        setError]        = useState<string | null>(null);

  const pwLen = password.length;
  const pwOk  = pwLen >= 6;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwOk) return;
    setError(null);
    setState("loading");
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setState("success");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset kata sandi. Token mungkin sudah kedaluwarsa.");
      setState("idle");
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4 px-6">
        <div className="rounded-2xl border border-polks-border bg-polks-bg p-5 text-center">
          <p className="text-[14px] font-semibold text-polks-error">Tautan tidak valid.</p>
          <p className="mt-1.5 text-[13px] text-polks-muted">Minta ulang tautan reset kata sandi dari halaman lupa kata sandi.</p>
        </div>
        <Link href="/forgot-password" className="flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white">
          Minta Tautan Baru
        </Link>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col gap-4 px-6">
        <div className="rounded-2xl border border-polks-border bg-polks-bg p-5 text-center">
          <p className="text-[15px] font-bold text-polks-text">Kata sandi berhasil diperbarui!</p>
          <p className="mt-2 text-[13px] leading-relaxed text-polks-muted">Kamu akan diarahkan ke halaman login…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7 px-6">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
          Buat kata sandi baru
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
          Masukkan kata sandi baru minimal 6 karakter.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5 px-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-[#374151]">Kata Sandi Baru</label>
          <div className="relative flex items-center">
            <Lock size={18} className="absolute left-4 text-[#9CA3AF]" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className={
                "h-14 w-full rounded-2xl border-[1.5px] bg-polks-card pl-11 pr-12 text-sm text-polks-text outline-none transition-colors focus:border-polks-brand " +
                (pwLen > 0 && !pwOk ? "border-polks-error" : pwOk ? "border-green-400" : "border-polks-border")
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-4 text-[#9CA3AF]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {pwLen > 0 && !pwOk && (
            <p className="text-[12px] text-polks-muted">{6 - pwLen} karakter lagi</p>
          )}
        </div>

        {error && <p className="text-[13px] text-polks-error">{error}</p>}

        <button
          type="submit"
          disabled={state === "loading" || !pwOk}
          className="mt-1 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,52,63,0.25)] disabled:opacity-60"
        >
          {state === "loading" ? "Menyimpan…" : "Simpan Kata Sandi Baru"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen justify-center bg-polks-card font-body text-polks-text md:bg-transparent">
      <div className="polks-phone flex min-h-screen w-full flex-col bg-polks-card">
        <div className="px-5 pt-5">
          <Link href="/login" aria-label="Kembali" className="inline-flex p-1">
            <ArrowLeft size={22} color="#17212A" />
          </Link>
        </div>

        <div className="flex flex-col items-center px-8 pb-6 pt-6">
          <div className="flex size-[100px] items-center justify-center rounded-[28px] bg-polks-brand shadow-[0_12px_40px_rgba(37,52,63,0.2)]">
            <Image
              src="/polks/icon.png"
              alt="POLKS"
              width={56}
              height={56}
              className="size-14 object-contain brightness-0 invert"
              priority
            />
          </div>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
