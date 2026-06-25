"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginTwoFactor } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Saat akun pakai 2FA, login berhenti di tiket dan kita minta kode TOTP.
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.status === "2fa") {
        setTwoFactorToken(res.twoFactorToken);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
      setLoading(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!twoFactorToken) return;
    setError(null);
    setLoading(true);
    try {
      await loginTwoFactor(twoFactorToken, code.replace(/\s/g, ""));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifikasi gagal");
      setLoading(false);
    }
  }

  if (twoFactorToken) {
    return (
      <main className="flex min-h-screen justify-center bg-white font-body text-polks-text md:bg-transparent">
        <div className="polks-phone flex min-h-screen w-full flex-col bg-white">
          <div className="px-5 pt-5">
            <button
              type="button"
              aria-label="Kembali"
              onClick={() => {
                setTwoFactorToken(null);
                setCode("");
                setError(null);
              }}
              className="inline-flex p-1"
            >
              <ArrowLeft size={22} color="#17212A" />
            </button>
          </div>

          <div className="flex flex-col items-center px-8 pb-6 pt-6">
            <div className="flex size-[100px] items-center justify-center rounded-[28px] bg-polks-brand shadow-[0_12px_40px_rgba(37,52,63,0.2)]">
              <ShieldCheck size={48} className="text-white" />
            </div>
          </div>

          <div className="mb-7 px-6">
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
              Verifikasi 2 langkah
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
              Masukkan 6 digit kode dari aplikasi authenticator kamu (Google
              Authenticator, Authy, dll).
            </p>
          </div>

          <form onSubmit={onVerify} className="flex flex-col gap-3.5 px-6">
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="h-16 w-full rounded-2xl border-[1.5px] border-polks-border bg-white text-center text-[28px] font-bold tracking-[0.4em] text-polks-text outline-none transition-colors focus:border-polks-brand"
            />

            {error ? <p className="text-[13px] text-polks-error">{error}</p> : null}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-1 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,52,63,0.25)] disabled:opacity-60"
            >
              {loading ? "Memverifikasi…" : "Verifikasi"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-white font-body text-polks-text md:bg-transparent">
      <div className="polks-phone flex min-h-screen w-full flex-col bg-white">
        <div className="px-5 pt-5">
          <Link href="/" aria-label="Kembali" className="inline-flex p-1">
            <ArrowLeft size={22} color="#17212A" />
          </Link>
        </div>

        {/* Logo mark */}
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

        {/* Heading */}
        <div className="mb-7 px-6">
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
            Selamat datang
            <br />
            di POLKS.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
            Masuk untuk kumpulkan poin resmi dan tukar reward dari setiap kunjungan.
          </p>
        </div>

        {/* Form */}
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
                className="h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-white pl-11 pr-4 text-sm text-polks-text outline-none transition-colors focus:border-polks-brand"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-[#374151]">Password</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-white pl-11 pr-12 text-sm text-polks-text outline-none transition-colors focus:border-polks-brand"
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
          </div>

          {error ? <p className="text-[13px] text-polks-error">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,52,63,0.25)] disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Login"}
          </button>

          {/* Divider */}
          <div className="my-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-polks-surface" />
            <span className="text-xs text-[#C0CBD3]">atau</span>
            <div className="h-px flex-1 bg-polks-surface" />
          </div>

          <GoogleButton label="Lanjut dengan Google" />

          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-[13px] text-[#8A959D]">Belum punya akun?</span>
            <Link href="/register" className="text-[13px] font-semibold text-polks-brand">
              Daftar sekarang
            </Link>
          </div>
        </form>

        <div className="mt-auto px-6 pb-8 pt-6">
          <p className="text-center text-[11px] leading-relaxed text-[#C0CBD3]">
            Dengan melanjutkan, kamu menyetujui{" "}
            <Link href="/terms" className="font-semibold text-polks-muted underline-offset-2 hover:underline">Syarat &amp; Ketentuan</Link> dan{" "}
            <Link href="/privacy" className="font-semibold text-polks-muted underline-offset-2 hover:underline">Kebijakan Privasi</Link> POLKS.
          </p>
        </div>
      </div>
    </main>
  );
}
