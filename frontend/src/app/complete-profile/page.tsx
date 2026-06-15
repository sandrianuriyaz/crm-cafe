"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, UserRound } from "lucide-react";
import { api, ApiError, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Harus sudah login (punya token). Prefill nama kalau sudah ada.
  useEffect(() => {
    if (typeof window !== "undefined" && !getToken()) {
      router.replace("/login");
      return;
    }
    if (user?.name) setName(user.name);
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Nama lengkap minimal 2 karakter.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Backend menyimpan name (+phone). Field lain dikirim untuk dukungan ke depan.
      await api("/member/profile", {
        method: "PATCH",
        body: {
          name: name.trim(),
          ...(email.trim() ? { email: email.trim() } : {}),
          ...(birthDate ? { birthDate } : {}),
          ...(gender ? { gender } : {}),
        },
      });
      await refreshProfile();
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
      setSaving(false);
    }
  }

  const field =
    "h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-white pl-11 pr-4 text-sm text-polks-text outline-none transition-colors focus:border-polks-brand";

  return (
    <main className="flex min-h-screen justify-center bg-white font-body text-polks-text md:bg-transparent">
      <div className="polks-phone flex min-h-screen w-full flex-col bg-white">
        {/* Logo mark */}
        <div className="flex flex-col items-center px-8 pb-5 pt-10">
          <div className="flex size-[88px] items-center justify-center rounded-[26px] bg-polks-brand shadow-[0_12px_40px_rgba(37,52,63,0.2)]">
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
        <div className="mb-6 px-6 text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.01em] text-polks-text">
            Lengkapi Profil
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
            Sedikit lagi! Isi data dirimu untuk mulai mengumpulkan poin.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-3 px-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-[#374151]">
              Nama Lengkap
            </label>
            <div className="relative flex items-center">
              <User size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input
                id="name"
                type="text"
                required
                placeholder="Nama kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-[#374151]">
              Email <span className="font-normal text-[#9CA3AF]">(opsional)</span>
            </label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="birth" className="text-xs font-semibold text-[#374151]">
              Tanggal Lahir <span className="font-normal text-[#9CA3AF]">(opsional)</span>
            </label>
            <div className="relative flex items-center">
              <Calendar size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input
                id="birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="gender" className="text-xs font-semibold text-[#374151]">
              Jenis Kelamin <span className="font-normal text-[#9CA3AF]">(opsional)</span>
            </label>
            <div className="relative flex items-center">
              <UserRound size={18} className="absolute left-4 text-[#9CA3AF]" />
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={field + " appearance-none"}
              >
                <option value="">Pilih…</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
          </div>

          {error ? <p className="text-[13px] text-polks-error">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,52,63,0.25)] disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan & Lanjut"}
          </button>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="pt-1 text-center text-[13px] font-medium text-polks-muted"
          >
            Lewati dulu
          </button>
        </form>

        <div className="mt-auto px-6 pb-8 pt-6">
          <p className="text-center text-[11px] leading-relaxed text-[#C0CBD3]">
            Data ini membantu personalisasi promo & reward untukmu.
          </p>
        </div>
      </div>
    </main>
  );
}
