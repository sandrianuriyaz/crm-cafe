"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, IdCard, Award, Calendar, ShieldCheck } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";

type MemberProfile = {
  memberCode: string;
  name: string;
  email: string;
  phone: string | null;
  pointBalance: number;
  createdAt: string;
  emailVerified?: boolean;
};

function formatJoined(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function AccountInfoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [p, setP]               = useState<MemberProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sendingVerif, setSendingVerif] = useState(false);
  const [verifSent, setVerifSent]       = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    let alive = true;
    api<MemberProfile>("/member/profile")
      .then((d) => { if (alive) setP(d); })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) { router.replace("/login"); return; }
        setError("Gagal memuat data akun. Coba lagi.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  };

  useEffect(load, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const tierMeta = TIER_META[user?.tier ?? "bronze"];

  const rows = [
    { Icon: User, label: "Nama Lengkap", value: p?.name ?? user?.name ?? "—" },
    { Icon: Mail, label: "Email", value: p?.email ?? user?.email ?? "—" },
    { Icon: Phone, label: "Nomor HP", value: p?.phone || "—" },
    { Icon: IdCard, label: "Member ID", value: p?.memberCode ?? user?.memberCode ?? "—" },
    { Icon: Award, label: "Tier", value: `${tierMeta.label} Member` },
    { Icon: Calendar, label: "Bergabung", value: p ? formatJoined(p.createdAt) : "—" },
  ];

  return (
    <CustomerShell showHeader={false} showBottomNav={false} topbarRight={null}>
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          aria-label="Kembali"
          className="mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors active:bg-white/20"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">Informasi Akun</h1>
        <p className="mt-1 text-[13px] text-white/50">Detail data membership kamu.</p>
      </div>

      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="bg-polks-bg px-5 pb-10">
        {loading ? (
          <div className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={"flex items-center gap-3 px-4 py-3.5 " + (i > 0 ? "border-t border-polks-surface" : "")}
              >
                <div className="skeleton size-9 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <div className="skeleton mb-1.5 h-2.5 w-1/4 rounded" />
                  <div className="skeleton h-3.5 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-polks-border bg-polks-card p-6 text-center">
            <p className="text-sm text-polks-muted">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-polks-brand px-5 py-2.5 text-xs font-bold text-white"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-polks-border bg-polks-card">
            {rows.map(({ Icon, label, value }, i) => (
              <div
                key={label}
                className={
                  "flex items-center gap-3 px-4 py-3.5 " +
                  (i > 0 ? "border-t border-polks-surface" : "")
                }
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-polks-surface">
                  <Icon size={16} className="text-polks-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-[#8A959D]">{label}</p>
                  <p className="truncate text-[14px] font-semibold text-polks-text-soft">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Email verification banner */}
        {!loading && !error && p && p.email && p.emailVerified === false && (
          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-amber-800">Email belum diverifikasi</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                Verifikasi email untuk mengamankan akun kamu.
              </p>
              <button
                type="button"
                disabled={sendingVerif || verifSent}
                onClick={async () => {
                  setSendingVerif(true);
                  try {
                    await api("/auth/verify-email/send", { method: "POST" });
                    setVerifSent(true);
                  } catch {}
                  finally { setSendingVerif(false); }
                }}
                className="mt-2 text-[12px] font-bold text-amber-800 underline underline-offset-2 disabled:opacity-60"
              >
                {verifSent ? "Email terkirim — cek inbox kamu" : sendingVerif ? "Mengirim…" : "Kirim email verifikasi"}
              </button>
            </div>
          </div>
        )}

        <p className="mt-3 px-1 text-[11px] leading-relaxed text-polks-muted">
          Untuk mengubah data akun, hubungi admin POLKS atau pusat bantuan.
        </p>
      </div>
    </CustomerShell>
  );
}
