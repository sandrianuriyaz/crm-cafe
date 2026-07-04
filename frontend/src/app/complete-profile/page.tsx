"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Phone } from "lucide-react";
import { api, ApiError, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Harus sudah login (punya token). Prefill nama dari akun Google.
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
    if (phone.trim().length < 8) {
      setError("Masukkan nomor HP yang valid.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api("/member/profile", {
        method: "PATCH",
        body: { name: name.trim(), phone: phone.trim() },
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
    "h-14 w-full rounded-2xl border-[1.5px] border-polks-border bg-polks-card pl-11 pr-4 text-sm text-polks-text outline-none transition-colors focus:border-polks-brand";

  return (
    <main className="flex min-h-screen justify-center bg-polks-card font-body text-polks-text md:bg-transparent">
      <div className="polks-phone flex min-h-screen w-full flex-col bg-polks-card">
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
            Satu Langkah Lagi
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8A959D]">
            Lengkapi profilmu — masukkan nomor HP untuk mengaktifkan poin & member card.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5 px-6">
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
            <label htmlFor="phone" className="text-xs font-semibold text-[#374151]">
              Nomor HP
            </label>
            <div className="relative flex items-center">
              <Phone size={18} className="absolute left-4 text-[#9CA3AF]" />
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={field}
              />
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Dipakai untuk verifikasi member & pencatatan poin di kasir.
            </p>
          </div>

          {error ? <p className="text-[13px] text-polks-error">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(37,52,63,0.25)] disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan & Lanjut"}
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
