"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, IdCard, Award, Calendar } from "lucide-react";
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
};

function formatJoined(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function AccountInfoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [p, setP] = useState<MemberProfile | null>(null);

  useEffect(() => {
    let alive = true;
    api<MemberProfile>("/member/profile")
      .then((d) => alive && setP(d))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.replace("/login");
      });
    return () => {
      alive = false;
    };
  }, [router]);

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
          className="mb-4 flex items-center gap-1.5 text-[13px] font-medium text-white/50"
        >
          <ArrowLeft size={16} />
          Kembali
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
        <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
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
                <p className="truncate text-[14px] font-semibold text-polks-text">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 px-1 text-[11px] leading-relaxed text-polks-muted">
          Untuk mengubah data akun, hubungi admin POLKS atau pusat bantuan.
        </p>
      </div>
    </CustomerShell>
  );
}
