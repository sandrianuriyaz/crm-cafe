"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { api } from "@/lib/api";

type State = "idle" | "loading" | "success";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [state, setState]   = useState<State>("idle");
  const [error, setError]   = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("loading");
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });
      setState("success");
    } catch {
      setError("Gagal mengirim permintaan. Coba lagi.");
      setState("idle");
    }
  }

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

        {state === "success" ? (
          <div className="flex flex-col gap-4 px-6">
            <div className="rounded-2xl border border-polks-border bg-polks-bg p-5 text-center">
              <p className="text-[15px] font-bold text-polks-text">Email terkirim!</p>
              <p className="mt-2 text-[13px] leading-relaxed text-polks-muted">
                Jika email <span className="font-semibold text-polks-text">{email}</span> terdaftar, tautan reset kata sandi telah dikirim. Cek inbox atau folder spam.
              </p>
            </div>
            <Link
              href="/login"
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white"
            >
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-7 px-6">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
                Lupa kata sandi?
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
                Masukkan email akunmu. Kami akan kirimkan tautan untuk membuat kata sandi baru.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-3.5 px-6">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-[#374151]">Email</label>
                <div className="relative flex items-center">
                  <Mail size={18} className="absolute left-4 text-[#9CA3AF]" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    className="h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-polks-card pl-11 pr-4 text-sm text-polks-text outline-none transition-colors focus:border-polks-brand"
                  />
                </div>
              </div>

              {error && <p className="text-[13px] text-polks-error">{error}</p>}

              <button
                type="submit"
                disabled={state === "loading" || !email.trim()}
                className="mt-1 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,52,63,0.25)] disabled:opacity-60"
              >
                {state === "loading" ? "Mengirim…" : "Kirim Tautan Reset"}
              </button>

              <Link
                href="/login"
                className="mt-1 text-center text-[13px] font-semibold text-polks-brand"
              >
                Kembali ke Login
              </Link>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
