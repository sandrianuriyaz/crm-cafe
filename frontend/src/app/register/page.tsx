"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, User, Mail, Phone, Cake, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GoogleButton } from "@/components/auth/google-button";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", birthDate: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwTouched, setPwTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwLen = form.password.length;
  const pwOk  = pwLen >= 6;
  const pwErr = pwTouched && !pwOk
    ? pwLen === 0
      ? "Password wajib diisi."
      : `Minimal 6 karakter (${6 - pwLen} lagi).`
    : null;

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.phone.trim().length < 8) {
      setError("Masukkan nomor HP yang valid.");
      return;
    }
    if (!pwOk) {
      setPwTouched(true);
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        birthDate: form.birthDate || undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal");
      setLoading(false);
    }
  }

  const fieldClass =
    "h-[52px] w-full rounded-2xl border-[1.5px] border-polks-border bg-polks-card pl-11 pr-4 text-sm text-polks-text outline-none transition-colors focus:border-polks-brand";

  return (
    <main className="flex min-h-screen justify-center bg-polks-card font-body text-polks-text md:bg-transparent">
      <div className="polks-phone flex min-h-screen w-full flex-col bg-polks-card">
        <div className="px-5 pt-5">
          <Link href="/" aria-label="Kembali" className="inline-flex p-1">
            <ArrowLeft size={22} color="#17212A" />
          </Link>
        </div>

        {/* Logo mark */}
        <div className="flex flex-col items-center px-8 pb-5 pt-5">
          <div className="flex size-[88px] items-center justify-center rounded-[26px] bg-polks-brand shadow-[0_12px_40px_rgba(37,52,63,0.2)]">
            <Image
              src="/polks/icon.png"
              alt="POLKS"
              width={52}
              height={52}
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-5 px-6">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-polks-text">
            Buat akun
            <br />
            POLKS gratis.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
            Daftar pakai email & mulai kumpulkan poin dari setiap kunjungan.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-3 px-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-[#374151]">Nama Lengkap</label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input id="name" type="text" required autoComplete="name" placeholder="Nama kamu"
                value={form.name} onChange={update("name")} className={fieldClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-[#374151]">Email</label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input id="email" type="email" required autoComplete="email" placeholder="hello@example.com"
                value={form.email} onChange={update("email")} className={fieldClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-[#374151]">
              Nomor HP
            </label>
            <div className="relative flex items-center">
              <Phone size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input id="phone" type="tel" inputMode="numeric" autoComplete="tel" required minLength={8} placeholder="08xxxxxxxxxx"
                value={form.phone} onChange={update("phone")} className={fieldClass} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="birthDate" className="text-xs font-semibold text-[#374151]">
              Tanggal Lahir <span className="font-normal text-[#9CA3AF]">(opsional)</span>
            </label>
            <div className="relative flex items-center">
              <Cake size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input id="birthDate" type="date" autoComplete="bday" placeholder="YYYY-MM-DD"
                value={form.birthDate} onChange={update("birthDate")} className={fieldClass} />
            </div>
            <p className="text-[11px] text-[#9CA3AF]">Biar kami bisa kasih kejutan pas ulang tahunmu.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-[#374151]">Password</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Buat password (min. 6 karakter)"
                value={form.password}
                onChange={update("password")}
                onBlur={() => setPwTouched(true)}
                className={
                  fieldClass.replace("pr-4", "pr-12") +
                  (pwErr ? " border-polks-error" : pwTouched && pwOk ? " border-green-500" : "")
                }
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-4 text-[#9CA3AF]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {pwErr ? (
              <p className="text-[12px] text-polks-error">{pwErr}</p>
            ) : pwLen > 0 && !pwOk ? (
              <p className="text-[12px] text-polks-muted">{6 - pwLen} karakter lagi</p>
            ) : null}
          </div>

          {error ? <p className="text-[13px] text-polks-error">{error}</p> : null}

          <button type="submit" disabled={loading}
            className="mt-1 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,52,63,0.25)] disabled:opacity-60">
            {loading ? "Memproses…" : "Buat Akun"}
          </button>

          <div className="my-1 flex items-center gap-3">
            <div className="h-px flex-1 bg-polks-surface" />
            <span className="text-xs text-[#C0CBD3]">atau</span>
            <div className="h-px flex-1 bg-polks-surface" />
          </div>

          <GoogleButton label="Daftar dengan Google" />

          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-[13px] text-[#8A959D]">Sudah punya akun?</span>
            <Link href="/login" className="text-[13px] font-semibold text-polks-brand">Login</Link>
          </div>
        </form>

        <div className="mt-auto px-6 pb-8 pt-6">
          <p className="text-center text-[11px] leading-relaxed text-[#C0CBD3]">
            Dengan mendaftar, kamu menyetujui{" "}
            <Link href="/terms" className="font-semibold text-polks-muted underline-offset-2 hover:underline">Syarat &amp; Ketentuan</Link> dan{" "}
            <Link href="/privacy" className="font-semibold text-polks-muted underline-offset-2 hover:underline">Kebijakan Privasi</Link> POLKS.
          </p>
        </div>
      </div>
    </main>
  );
}
