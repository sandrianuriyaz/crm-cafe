"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Users, Zap, Star, Store } from "lucide-react";
import { useAuth } from "@/lib/auth";

const features = [
  { Icon: Zap, text: "POS Transaction Webhook" },
  { Icon: Star, text: "Official Point Balance" },
  { Icon: Users, text: "Member & QR Management" },
  { Icon: Store, text: "Rewards & Voucher Control" },
];

const stats = [
  { val: "1,248", label: "Members" },
  { val: "3", label: "Outlets" },
  { val: "245K", label: "Points Issued" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.status === "2fa") {
        setError("Akun ini mengaktifkan verifikasi 2 langkah. Masuk lewat aplikasi customer untuk menyelesaikan verifikasi.");
        setLoading(false);
        return;
      }
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-polks-bg font-body">
      {/* Left panel */}
      <div
        className="relative hidden w-[45%] min-w-[480px] flex-col justify-center overflow-hidden px-16 py-14 lg:flex"
        style={{ background: "linear-gradient(160deg,#1a2830 0%,#25343F 50%,#1e3040 100%)" }}
      >
        <div className="absolute -right-16 -top-16 size-[300px] rounded-full bg-white/[0.04]" />
        <div className="absolute bottom-16 right-10 size-[180px] rounded-full bg-[rgba(246,184,75,0.04)]" />
        <div className="relative">
          <Image src="/polks/logo.png" alt="POLKS" width={120} height={48} className="h-11 w-auto object-contain" priority />
          <div className="mb-10 mt-9">
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-white">POLKS CRM Admin</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Kelola member, reward, voucher, transaksi POS, dan poin resmi CRM.
            </p>
          </div>
          <div className="mb-11 flex flex-col gap-3">
            {features.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-[10px] border border-white/20 bg-white/[0.06]">
                  <Icon size={14} className="text-white/60" />
                </div>
                <span className="text-[13px] font-medium text-white/70">{text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            {stats.map(({ val, label }) => (
              <div
                key={label}
                className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.07] px-4 py-3.5 text-center"
              >
                <div className="text-[22px] font-bold tracking-[-0.02em] text-polks-point">{val}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.07em] text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-9 text-center lg:text-left">
            <Image
              src="/polks/icon.png"
              alt="POLKS"
              width={48}
              height={48}
              className="mx-auto mb-4 size-12 rounded-2xl bg-polks-brand p-2 brightness-0 invert lg:hidden"
            />
            <h2 className="text-2xl font-bold tracking-[-0.02em] text-polks-text">Sign In</h2>
            <p className="mt-1.5 text-[13px] text-polks-muted">POLKS CRM Admin Panel</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-polks-text">Email</label>
              <div className="relative flex items-center">
                <Mail size={15} className="absolute left-3.5 text-[#8A959D]" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="admin@polks.test"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border-[1.5px] border-polks-border bg-white pl-[42px] pr-4 text-sm text-polks-text outline-none focus:border-polks-brand"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-polks-text">Password</label>
              <div className="relative flex items-center">
                <Lock size={15} className="absolute left-3.5 text-[#8A959D]" />
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border-[1.5px] border-polks-border bg-white pl-[42px] pr-11 text-sm text-polks-text outline-none focus:border-polks-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 text-[#8A959D]"
                  aria-label={showPass ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="size-[15px] accent-polks-brand" />
                <span className="text-xs text-polks-muted">Remember me</span>
              </label>
              <span className="text-xs font-semibold text-polks-muted">Forgot password?</span>
            </div>

            {error ? <p className="text-[13px] text-polks-error">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-[50px] rounded-xl bg-polks-brand text-sm font-bold text-white disabled:opacity-60"
            >
              {loading ? "Memproses…" : "Sign In to Admin Panel"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs text-[#8A959D]"
              >
                ← Kembali ke Member App
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-[#C0CBD3]">
            Panel ini hanya untuk admin POLKS yang berwenang.
          </p>
        </div>
      </div>
    </div>
  );
}
