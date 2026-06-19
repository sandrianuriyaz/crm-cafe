"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, ChevronRight, Gift, History, MapPin, Star } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";
import { type Promo, type Reward } from "@/lib/loyalty/types";

const quickLinks = [
  { label: "Riwayat", Icon: History, href: "/history" as const },
  { label: "Outlet", Icon: MapPin, href: "/outlets" as const },
];

function formatPeriod(startAt: string | null, endAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  if (startAt && endAt) return `${fmt(startAt)} – ${fmt(endAt)}`;
  if (endAt) return `s/d ${fmt(endAt)}`;
  if (startAt) return `mulai ${fmt(startAt)}`;
  return "Berlaku terus";
}

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Reward[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [unread, setUnread] = useState(0);

  const name = user?.name || "Member";
  const points = user?.pointBalance ?? 0;
  const tierMeta = TIER_META[user?.tier ?? "bronze"];

  useEffect(() => {
    api<Reward[]>("/rewards")
      .then((d) => setRecs(d.slice(0, 2)))
      .catch(() => setRecs([]));
    api<Promo[]>("/promos")
      .then((d) => setPromos(d.slice(0, 2)))
      .catch(() => setPromos([]));
    api<{ count: number }>("/member/notifications/unread-count")
      .then((r) => setUnread(r.count))
      .catch(() => setUnread(0));
  }, []);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      {/* Top bar */}
      <div className="flex items-center justify-between bg-polks-brand px-5 pt-4">
        <Image
          src="/polks/logo.png"
          alt="POLKS"
          width={96}
          height={40}
          className="h-8 w-auto object-contain"
          priority
        />
        <Link href="/inbox" aria-label="Notifikasi" className="relative">
          <Bell size={20} color="rgba(255,255,255,0.65)" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 size-[8px] rounded-full border-[1.5px] border-polks-brand bg-white" />
          ) : null}
        </Link>
      </div>

      {/* Balance hero — poin sebagai fokus */}
      <div className="bg-polks-brand px-5 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/45">Halo,</p>
            <p className="text-lg font-bold tracking-[-0.01em] text-white">{name}</p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ backgroundColor: tierMeta.badgeBg, color: tierMeta.badgeText }}
          >
            {tierMeta.label}
          </span>
        </div>

        <div className="mt-7">
          <p className="text-[11px] uppercase tracking-[0.08em] text-white/40">Saldo Poin</p>
          <div className="mt-1 flex items-baseline gap-2">
            <Star size={22} color="#F6B84B" fill="#F6B84B" />
            <span className="text-[40px] font-black leading-none tracking-[-0.02em] text-white">
              {points.toLocaleString("id-ID")}
            </span>
            <span className="text-sm font-semibold text-white/50">pts</span>
          </div>
        </div>

      </div>

      {/* Wave */}
      <div className="bg-polks-brand leading-none">
        <svg viewBox="0 0 390 28" preserveAspectRatio="none" className="block h-7 w-full">
          <path d="M0,0 Q195,28 390,0 L390,28 L0,28 Z" fill="#F6F8FA" />
        </svg>
      </div>

      {/* Konten */}
      <div className="flex flex-col gap-7 bg-polks-bg px-5 pb-28 pt-3">
        {/* Quick links — ringkas */}
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map(({ label, Icon, href }) => (
            <Link key={label} href={href} className="flex flex-col items-center gap-1.5 py-1">
              <Icon size={22} color="#25343F" strokeWidth={1.8} />
              <span className="text-[11px] font-medium text-polks-muted">{label}</span>
            </Link>
          ))}
        </div>

        {/* Reward untuk kamu (data asli) */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-polks-text">Reward untuk Kamu</h3>
            <Link href="/rewards" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
              Semua <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex gap-3">
            {(recs.length > 0 ? recs : [null, null]).map((r, i) => (
              <Link
                key={r?.id ?? i}
                href="/rewards"
                className="flex-1 rounded-2xl border border-polks-border bg-white p-4 text-left"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-polks-point-soft">
                  <Gift size={16} color="#C99A2E" />
                </div>
                {r ? (
                  <>
                    <p className="mb-1 line-clamp-1 text-xs font-semibold text-polks-text">{r.name}</p>
                    <span className="text-xs font-semibold text-polks-muted">
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

        {/* Promo — sekunder, ringkas (data asli) */}
        {promos.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-polks-text">Promo</h3>
              <Link href="/promos" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
                Semua <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {promos.map((p) => (
                <Link
                  key={p.id}
                  href={`/promos/${p.id}`}
                  className="overflow-hidden rounded-2xl border border-polks-border bg-white"
                >
                  {p.imageUrl ? (
                    <div className="relative aspect-[16/9] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="size-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-8">
                        <p className="truncate text-[14px] font-bold text-white">{p.title}</p>
                        <p className="text-[11px] text-white/70">{formatPeriod(p.startAt, p.endAt)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0 pr-3">
                        <p className="mb-0.5 truncate text-[13px] font-semibold text-polks-text">{p.title}</p>
                        <p className="text-[11px] text-[#8A959D]">{formatPeriod(p.startAt, p.endAt)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-polks-brand px-2.5 py-1 text-[10px] font-bold text-white">
                        Aktif
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </CustomerShell>
  );
}
