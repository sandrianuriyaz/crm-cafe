"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  User,
  Store,
  Bell,
  HelpCircle,
  LogOut,
  Shield,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getTier, getNextTier, TIER_META } from "@/lib/loyalty/tier";

type MemberProfile = {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  phone: string | null;
  pointBalance: number;
  tier: string | null;
  createdAt: string;
};

function initialOf(name: string) {
  return (name.trim()[0] || "?").toUpperCase();
}

const menuSections = [
  {
    title: "Akun",
    items: [
      { label: "Informasi Akun", Icon: User },
      { label: "Lokasi Outlet", Icon: Store },
      { label: "Notifikasi", Icon: Bell },
      { label: "Keamanan", Icon: Shield },
    ],
  },
  {
    title: "Bantuan",
    items: [{ label: "Pusat Bantuan", Icon: HelpCircle }],
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<MemberProfile | null>(null);

  useEffect(() => {
    let alive = true;
    api<MemberProfile>("/member/profile")
      .then((p) => {
        if (alive) setProfile(p);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.replace("/login");
      });
    return () => {
      alive = false;
    };
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const name = profile?.name || user?.name || "Member";
  const phone = profile?.phone || "—";
  const points = profile?.pointBalance ?? user?.pointBalance ?? 0;
  const memberId = profile?.memberCode || user?.memberCode || "—";
  const tier = getTier(points);
  const tierMeta = TIER_META[tier];
  const next = getNextTier(points);
  const progress = next ? Math.min(100, (points / next.target) * 100) : 100;

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Header */}
      <div className="bg-polks-brand px-5 pb-7 pt-4">
        <div className="mb-5 flex items-center justify-between">
          <Image
            src="/polks/logo.png"
            alt="POLKS"
            width={80}
            height={32}
            className="h-7 w-auto object-contain"
            priority
          />
          <span className="text-[11px] text-white/40">POLKS Group</span>
        </div>

        {/* Profile row */}
        <div className="flex items-center gap-4">
          <div
            className="flex size-[60px] shrink-0 items-center justify-center rounded-full text-[22px] font-bold"
            style={{
              background: "linear-gradient(135deg,#1A2830,#2A3D4D)",
              border: `2.5px solid ${tierMeta.badgeText}`,
              color: tierMeta.badgeText,
            }}
          >
            {initialOf(name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-[-0.01em] text-white">{name}</h1>
            <p className="mt-0.5 text-xs text-white/45">{phone}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-[3px] text-[9px] font-semibold uppercase tracking-[0.07em]"
                style={{ backgroundColor: tierMeta.badgeBg, color: tierMeta.badgeText }}
              >
                {tierMeta.label} Member
              </span>
              <span className="rounded-full bg-polks-brand px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-white/20">
                Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Points + ID */}
        <div className="mt-5 flex gap-3">
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-3">
            <p className="text-[10px] text-white/40">Saldo Poin</p>
            <p className="text-xl font-bold tracking-[-0.02em]" style={{ color: tierMeta.badgeText }}>
              {points.toLocaleString("id-ID")}
              <span className="ml-1 text-[11px] font-semibold">pts</span>
            </p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.08] px-4 py-3">
            <p className="text-[10px] text-white/40">Member ID</p>
            <p className="mt-1 text-xs font-medium tracking-[0.02em] text-white">{memberId}</p>
          </div>
        </div>

        {/* Tier progress */}
        {next ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] text-white/40">
                {next.need.toLocaleString("id-ID")} pts lagi menuju {next.label}
              </span>
            </div>
            <div className="h-[5px] rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${progress}%`, backgroundColor: tierMeta.badgeText }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      <div className="flex flex-col gap-5 bg-polks-bg px-5 pb-28">
        {menuSections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8A959D]">
              {section.title}
            </p>
            <div className="overflow-hidden rounded-2xl border border-polks-border bg-white">
              {section.items.map(({ label, Icon }, i) => (
                <div
                  key={label}
                  className={
                    "flex items-center justify-between px-4 py-3.5 " +
                    (i > 0 ? "border-t border-polks-surface" : "")
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-polks-surface">
                      <Icon size={15} color="#25343F" />
                    </div>
                    <span className="text-[13px] font-semibold text-polks-text">{label}</span>
                  </div>
                  <ChevronRight size={16} color="#C0CBD3" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-polks-error bg-white py-4"
        >
          <LogOut size={16} color="#E04F4F" />
          <span className="text-sm font-bold text-polks-error">Keluar</span>
        </button>

        <p className="text-center text-[11px] text-[#C0CBD3]">
          POLKS Loyalty v1.0.0 · POLKS Group
        </p>
      </div>
    </CustomerShell>
  );
}
