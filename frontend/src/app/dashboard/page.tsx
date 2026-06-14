"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  ChevronRight,
  Gift,
  History,
  MapPin,
  QrCode,
  Star,
  Tag,
  Zap,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getTier, TIER_META } from "@/lib/loyalty/tier";
import { type Reward } from "@/lib/loyalty/types";

const banners = [
  { id: 1, title: "Diskon Kopi Susu 20%", sub: "Berlaku di semua outlet · s/d 30 Jun 2026", tag: "Promo Aktif" },
  { id: 2, title: "Buy 1 Get 1 Latte", sub: "Cafe A only · 15–20 Jun 2026", tag: "Terbatas" },
];

const promos = [
  { id: 1, title: "Diskon Kopi Susu 20%", period: "1–30 Jun 2026", outlet: "All Outlets", status: "active" as const },
  { id: 2, title: "Buy 1 Get 1 Latte", period: "15–20 Jun 2026", outlet: "Cafe A only", status: "limited" as const },
];

function StatusPill({ status }: { status: "active" | "limited" }) {
  const dark = status === "active";
  return (
    <span
      className={
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold " +
        (dark ? "bg-polks-brand text-white" : "bg-[#F3F4F6] text-[#374151]")
      }
    >
      {dark ? "Active" : "Limited"}
    </span>
  );
}

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [activeBanner, setActiveBanner] = useState(0);
  const [recs, setRecs] = useState<Reward[]>([]);

  const name = user?.name || "Member";
  const points = user?.pointBalance ?? 0;
  const tierMeta = TIER_META[getTier(points)];

  useEffect(() => {
    api<Reward[]>("/rewards")
      .then((d) => setRecs(d.slice(0, 2)))
      .catch(() => setRecs([]));
  }, []);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Sticky header */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-polks-brand px-5 py-3">
        <Image
          src="/polks/logo.png"
          alt="POLKS"
          width={96}
          height={40}
          className="h-8 w-auto object-contain"
          priority
        />
        <button type="button" aria-label="Notifikasi" className="relative">
          <Bell size={20} color="rgba(255,255,255,0.65)" />
          <span className="absolute -right-0.5 -top-0.5 size-[7px] rounded-full border-[1.5px] border-polks-brand bg-white/40" />
        </button>
      </div>

      {/* Promo banner */}
      <div className="bg-polks-brand px-4 pb-5">
        <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.06]">
          <div className="px-5 pb-4 pt-5">
            <span className="mb-2 inline-block rounded-full bg-white/[0.12] px-2.5 py-[3px] text-[9px] font-medium uppercase tracking-[0.08em] text-white/70">
              {banners[activeBanner].tag}
            </span>
            <h2 className="mb-1.5 text-xl font-bold leading-tight tracking-[-0.01em] text-white">
              {banners[activeBanner].title}
            </h2>
            <p className="text-xs text-white/50">{banners[activeBanner].sub}</p>
            <Link
              href="/rewards"
              className="mt-3.5 inline-flex h-[34px] items-center rounded-[10px] border border-white/20 bg-white/10 px-4 text-xs font-bold text-white"
            >
              Lihat Promo
            </Link>
          </div>
          <div className="flex justify-center gap-1.5 pb-3.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => setActiveBanner(i)}
                className={
                  "h-[5px] rounded-full transition-all " +
                  (i === activeBanner ? "w-4 bg-white" : "w-[5px] bg-white/25")
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* White section */}
      <div className="bg-white">
        {/* Greeting + tier + points */}
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-4">
          <div>
            <p className="text-xs text-[#8A959D]">Halo,</p>
            <p className="text-base font-bold tracking-[-0.01em] text-polks-text">{name}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span
              className="rounded-full px-2.5 py-[3px] text-[9px] font-semibold uppercase tracking-[0.06em]"
              style={{ backgroundColor: tierMeta.badgeBg, color: tierMeta.badgeText }}
            >
              {tierMeta.label}
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-polks-brand px-3 py-[5px]">
              <Star size={11} color="#F6B84B" fill="#F6B84B" />
              <span className="text-xs font-bold text-white">
                {points.toLocaleString("id-ID")} pts
              </span>
            </div>
          </div>
        </div>

        {/* 2-col CTA */}
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">
          <Link href="/member-card" className="rounded-2xl bg-polks-brand p-4 text-left">
            <div className="mb-2.5 flex size-[38px] items-center justify-center rounded-xl bg-white/[0.12]">
              <QrCode size={18} color="#ffffff" strokeWidth={2} />
            </div>
            <p className="text-[13px] font-bold text-white">Member Card</p>
            <p className="text-[11px] text-white/45">Scan di kasir</p>
          </Link>
          <Link href="/rewards" className="rounded-2xl bg-polks-bg p-4 text-left">
            <div className="mb-2.5 flex size-[38px] items-center justify-center rounded-xl bg-polks-surface">
              <Gift size={18} color="#17212A" strokeWidth={2} />
            </div>
            <p className="text-[13px] font-bold text-polks-text">Reward</p>
            <p className="text-[11px] text-[#8A959D]">Tukar poin</p>
          </Link>
        </div>

        {/* 4-col shortcuts */}
        <div className="grid grid-cols-4 gap-2 px-4 pb-5 pt-4">
          {[
            { label: "Promo", Icon: Tag, href: "/rewards" as const, accent: false },
            { label: "Riwayat", Icon: History, href: "/history" as const, accent: false },
            { label: "Outlet", Icon: MapPin, href: "/member-card" as const, accent: false },
            { label: "Poin", Icon: Star, href: "/history" as const, accent: true },
          ].map(({ label, Icon, href, accent }) => (
            <Link key={label} href={href} className="flex flex-col items-center gap-1.5">
              <div
                className={
                  "flex size-[52px] items-center justify-center rounded-2xl " +
                  (accent ? "bg-polks-brand" : "bg-polks-bg")
                }
              >
                <Icon
                  size={20}
                  color={accent ? "#F6B84B" : "#25343F"}
                  strokeWidth={1.8}
                />
              </div>
              <span className="text-[11px] font-semibold text-polks-muted">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 bg-polks-bg px-4 pb-28 pt-4">
        {/* Promo Hari Ini */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-polks-text">Promo Hari Ini</h3>
            <Link href="/rewards" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
              Semua <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {promos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-[14px] bg-white px-3.5 py-3"
              >
                <div>
                  <p className="mb-0.5 text-[13px] font-semibold text-polks-text">{p.title}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8A959D]">
                    <MapPin size={9} color="#8A959D" />
                    {p.outlet}
                    <span className="text-[#C0CBD3]">·</span>
                    {p.period}
                  </div>
                </div>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Reward untuk Kamu (data asli) */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-polks-text">Reward untuk Kamu</h3>
            <Link href="/rewards" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
              Semua <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex gap-2.5">
            {(recs.length > 0
              ? recs
              : [null, null]
            ).map((r, i) => (
              <Link
                key={r?.id ?? i}
                href="/rewards"
                className="flex-1 rounded-[14px] bg-white p-3.5 text-left"
              >
                <div className="mb-2.5 flex size-9 items-center justify-center rounded-[10px] bg-polks-bg">
                  <Gift size={16} color="#25343F" />
                </div>
                {r ? (
                  <>
                    <p className="mb-1 line-clamp-1 text-xs font-semibold text-polks-text">
                      {r.name}
                    </p>
                    <span className="text-xs font-semibold text-[#374151]">
                      {r.pointCost.toLocaleString("id-ID")} pts
                    </span>
                  </>
                ) : (
                  <>
                    <div className="mb-2 h-3 w-2/3 rounded bg-polks-surface" />
                    <div className="h-3 w-1/3 rounded bg-polks-surface" />
                  </>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Info poin */}
        <div className="flex items-center gap-2.5 rounded-[14px] bg-white px-3.5 py-3">
          <Zap size={14} color="#25343F" className="shrink-0" />
          <p className="text-[11px] leading-relaxed text-polks-muted">
            Poin diperbarui otomatis setelah kasir selesai scan QR melalui POS.
          </p>
        </div>
      </div>
    </CustomerShell>
  );
}
