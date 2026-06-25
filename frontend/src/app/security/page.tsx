"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Mail, KeyRound, LogOut } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { useAuth } from "@/lib/auth";

export default function SecurityPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Keamanan</h1>
        <p className="mt-1 text-[13px] text-white/50">Pengaturan keamanan akun POLKS kamu.</p>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-4 bg-polks-bg px-5 pb-10">
        {/* Status */}
        <div className="flex items-start gap-3 rounded-2xl border border-[rgba(56,161,105,0.3)] bg-[rgba(56,161,105,0.1)] px-4 py-3.5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-polks-success" />
          <div>
            <p className="text-[13px] font-bold text-polks-text">Akun terlindungi</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-polks-muted">
              Login pakai email &amp; password atau akun Google. POLKS tidak pernah meminta
              password kamu lewat chat, telepon, atau email.
            </p>
          </div>
        </div>

        {/* Metode login */}
        <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
              <Mail size={16} className="text-polks-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-polks-text">Metode Login</p>
              <p className="truncate text-[11px] text-polks-muted">
                {user?.email ?? "Email & Password"}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-polks-surface px-2.5 py-1 text-[10px] font-bold text-polks-muted">
              Aktif
            </span>
          </div>
        </div>

        {/* Ganti password */}
        <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
              <KeyRound size={16} className="text-polks-brand" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-polks-text">Ganti Password</p>
              <p className="text-[11px] text-polks-muted">Hubungi admin POLKS untuk reset password</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-polks-error bg-white py-4"
        >
          <LogOut size={16} className="text-polks-error" />
          <span className="text-sm font-bold text-polks-error">Keluar dari Akun</span>
        </button>

        <p className="px-1 text-[11px] leading-relaxed text-polks-muted">
          Untuk ubah email, nomor HP, atau reset password, hubungi admin POLKS atau pusat bantuan.
        </p>
      </div>
    </CustomerShell>
  );
}
