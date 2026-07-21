"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell, ChevronRight, Gift, Headphones, MapPin, QrCode, Star, Tag, Ticket,
} from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { PromoBanner } from "@/components/customer/promo-banner";
import { TierInfoSheet } from "@/components/customer/tier-info-sheet";
import { VoucherQrModal } from "@/components/customer/voucher-qr-modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCountUp } from "@/lib/hooks";
import { TIER_META, TIER_ICON, formatRupiah } from "@/lib/loyalty/tier";
import { type Promo, type Reward, type Voucher } from "@/lib/loyalty/types";

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={"skeleton rounded-xl " + (className ?? "")} />;
}

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const [promos,      setPromos]      = useState<Promo[]>([]);
  const [vouchers,    setVouchers]    = useState<Voucher[]>([]);
  const [rewards,     setRewards]     = useState<Reward[]>([]);
  const [unread,      setUnread]      = useState(0);
  const [pending,     setPending]     = useState(3);
  const [tierSheet,   setTierSheet]   = useState(false);
  const [qrVoucher,   setQrVoucher]   = useState<Voucher | null>(null);

  const firstName    = cap((user?.name || "Member").split(" ")[0]);
  const points       = user?.pointBalance ?? 0;
  const loading      = pending > 0;
  const animatedPts  = useCountUp(points, 900);
  const tierMeta     = TIER_META[user?.tier ?? "bronze"];
  // nextTier null hanya valid kalau tier memang "platinum"; selain itu tunggu profil lengkap
  const nextTier = user?.nextTier !== undefined
    ? user.nextTier
    : user?.tier === "platinum" ? null : undefined;
  const monthlySpend = user?.monthlySpend ?? 0;
  const progress     = nextTier ? Math.min(100, (monthlySpend / nextTier.min) * 100) : 100;

  const done = () => setPending((n) => n - 1);

  useEffect(() => {
    api<Promo[]>("/promos")
      .then((d) => setPromos(d.filter((p) => p.status === "ACTIVE").slice(0, 5)))
      .catch(() => setPromos([]))
      .finally(done);
    api<Voucher[]>("/vouchers")
      .then((d) => setVouchers(d.filter((v) => v.status === "ACTIVE").slice(0, 4)))
      .catch(() => setVouchers([]))
      .finally(done);
    api<Reward[]>("/rewards")
      .then((d) => setRewards(d.filter((r) => r.status === "ACTIVE").slice(0, 5)))
      .catch(() => setRewards([]))
      .finally(done);
    api<{ count: number }>("/member/notifications/unread-count")
      .then((r) => setUnread(r.count))
      .catch(() => setUnread(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carouselPromos = promos.filter((p) => p.imageUrl);

  return (
    <CustomerShell showHeader={false} topbarRight={null}>
      <div className="min-h-screen bg-polks-bg pb-28">

        {/* ── Banner + overlay logo/bell ──────────────────────────────────
            top-[12px] = PromoBanner mt-3(12px), no more CUP_ABOVE offset
            inset-x-4  = matches PromoBanner mx-4 */}
        <div className="relative">
          <PromoBanner />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <Image
                src="/polks/icon.png"
                alt=""
                width={20}
                height={20}
                className="h-5 w-auto drop-shadow"
                priority
              />
              <span className="text-[16px] font-black tracking-[-0.02em] text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.35)]">
                POLKS
              </span>
            </div>
            <Link
              href="/inbox"
              aria-label="Notifikasi"
              className="pointer-events-auto relative flex size-7 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
            >
              <Bell size={14} className="text-white" strokeWidth={1.8} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-white/60 bg-polks-error" />
              )}
            </Link>
          </div>
        </div>

        {/* ── White section ── */}
        <div className="bg-polks-card">

          {/* Member info row */}
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <div>
              <p className="text-[15px] font-bold text-polks-text">Halo, {firstName}!</p>
              <button
                type="button"
                onClick={() => setTierSheet(true)}
                className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{ backgroundColor: tierMeta.badgeBg + "33", color: tierMeta.badgeText }}
              >
                <Star size={8} fill={tierMeta.badgeText} color={tierMeta.badgeText} />
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">{tierMeta.label}</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Ticket size={14} className="text-polks-muted" strokeWidth={1.5} />
                <span className="text-[13px] font-bold text-polks-text">
                  {loading ? "–" : vouchers.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={13} fill="#F6B84B" color="#F6B84B" />
                <span className="text-[15px] font-black leading-none text-polks-text">
                  {animatedPts.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] font-semibold text-polks-muted">pts</span>
              </div>
            </div>
          </div>

          {/* 2 Big action buttons */}
          <div className="grid grid-cols-2 gap-2.5 px-4 pb-3">
            <Link
              href="/member-card"
              className="flex flex-col items-center gap-2 rounded-2xl bg-polks-brand px-3 py-4"
            >
              <QrCode size={22} className="text-white" strokeWidth={1.8} />
              <p className="text-[12px] font-bold text-white">Kartu Member</p>
            </Link>
            <Link
              href="/redeem-history"
              className="flex flex-col items-center gap-2 rounded-2xl bg-polks-surface px-3 py-4"
            >
              <Ticket size={22} className="text-polks-text" strokeWidth={1.8} />
              <p className="text-[12px] font-bold text-polks-text">Voucher Saya</p>
            </Link>
          </div>

          {/* 4 Quick actions */}
          <div className="grid grid-cols-4 divide-x divide-polks-border border-y border-polks-border">
            {([
              { href: "/promos",  Icon: Tag,        label: "Promo"   },
              { href: "/rewards", Icon: Gift,       label: "Rewards" },
              { href: "/outlets", Icon: MapPin,     label: "Outlet"  },
              { href: "/help",    Icon: Headphones, label: "Bantuan" },
            ] as const).map(({ href, Icon, label }) => (
              <Link key={label} href={href} className="flex flex-col items-center gap-1.5 py-3">
                <Icon size={18} className="text-polks-text" strokeWidth={1.8} />
                <p className="text-[10px] font-semibold text-polks-text">{label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Content sections ── */}
        <div className="flex flex-col gap-5 px-4 pt-4">

          {/* Tier progress — selalu tampil, bisa diklik untuk info lengkap */}
          <button
            type="button"
            onClick={() => setTierSheet(true)}
            className="w-full rounded-xl border border-polks-border bg-polks-card p-3 text-left"
          >
            {nextTier === undefined ? (
              // Profil (tier/nextTier) belum selesai di-fetch setelah login —
              // JANGAN samakan dengan "null" (platinum beneran), tampilkan skeleton.
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-2.5 w-32 rounded" />
                </div>
              </div>
            ) : nextTier !== null ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-polks-text">
                    Menuju {cap(nextTier.name)}
                  </p>
                  <p className="text-[10px] text-polks-muted">
                    {formatRupiah(monthlySpend)} / {formatRupiah(nextTier.min)}
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-polks-surface">
                  <div
                    className="h-full rounded-full bg-polks-brand transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[10px] text-polks-muted">
                    {formatRupiah(nextTier.remaining)} lagi untuk naik tier
                  </p>
                  <span className="text-[10px] font-semibold text-polks-brand">
                    Lihat info tier →
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="flex items-center gap-1 text-[12px] font-bold"
                    style={{ color: tierMeta.badgeText }}
                  >
                    <TIER_ICON.platinum size={13} strokeWidth={1.8} />
                    Platinum Member
                  </p>
                  <p className="mt-0.5 text-[10px] text-polks-muted">
                    Tier tertinggi · 1 poin per Rp 850
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-polks-brand">
                  Lihat info tier →
                </span>
              </div>
            )}
          </button>

          {/* Skeleton */}
          {loading && (
            <>
              <SkeletonBlock className="h-[68px]" />
              <SkeletonBlock className="h-[68px]" />
            </>
          )}

          {/* Voucher Aktif */}
          {!loading && vouchers.length > 0 && (
            <div className="fade-up" style={{ animationDelay: "120ms" }}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-polks-text">Voucher Aktif</h3>
                <Link
                  href="/redeem-history"
                  className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand"
                >
                  Semua <ChevronRight size={12} />
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {vouchers.slice(0, 2).map((v) => (
                  <div
                    key={v.id}
                    className="flex overflow-hidden rounded-xl border border-polks-border bg-polks-card"
                  >
                    <div className="flex w-[54px] shrink-0 flex-col items-center justify-center bg-polks-brand px-2 py-3">
                      <Ticket size={22} className="text-white" strokeWidth={1.8} />
                    </div>
                    <div className="flex flex-1 flex-col justify-center px-3 py-2.5">
                      <p className="text-[12px] font-bold text-polks-text">{v.reward.name}</p>
                      {v.expiredAt && (
                        <p className="mt-0.5 text-[9px] text-polks-muted">
                          Sampai{" "}
                          {new Date(v.expiredAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center px-3">
                      <button
                        type="button"
                        onClick={() => setQrVoucher(v)}
                        className="rounded-lg bg-polks-brand px-2.5 py-1.5 text-[10px] font-bold text-white"
                      >
                        Gunakan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reward untuk Kamu */}
          {!loading && (
            <div className="fade-up" style={{ animationDelay: "180ms" }}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-polks-text">Reward untuk Kamu</h3>
                <Link
                  href="/rewards"
                  className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand"
                >
                  Semua <ChevronRight size={12} />
                </Link>
              </div>
              <div className="flex gap-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {(rewards.length > 0 ? rewards : [null, null]).map((r, i) => (
                  <Link
                    key={r?.id ?? i}
                    href="/rewards"
                    className="relative w-[120px] shrink-0 overflow-hidden rounded-xl"
                  >
                    {r?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt={r.name} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center bg-polks-surface">
                        <Gift size={20} color="#C99A2E" strokeWidth={1.8} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      {r ? (
                        <>
                          <p className="line-clamp-1 text-[11px] font-black leading-tight text-white">{r.name}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-white/80">
                            {r.pointCost.toLocaleString("id-ID")} pts
                          </p>
                        </>
                      ) : (
                        <div className="h-2.5 w-3/4 rounded bg-white/30" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Promo & Berita */}
          {!loading && carouselPromos.length > 0 && (
            <div className="pb-2 fade-up" style={{ animationDelay: "240ms" }}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-polks-text">Promo &amp; Berita</h3>
                <Link
                  href="/promos"
                  className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand"
                >
                  Semua <ChevronRight size={12} />
                </Link>
              </div>
              <div className="flex gap-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {carouselPromos.map((p) => (
                  <Link
                    key={p.id}
                    href={`/promos/${p.id}`}
                    className="relative w-[120px] shrink-0 overflow-hidden rounded-xl"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl!} alt={p.title} className="aspect-square w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p className="line-clamp-2 text-[11px] font-black leading-tight text-white">{p.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {tierSheet && (
        <TierInfoSheet
          currentTier={user?.tier ?? "bronze"}
          monthlySpend={monthlySpend}
          onClose={() => setTierSheet(false)}
        />
      )}

      {qrVoucher && (
        <VoucherQrModal voucher={qrVoucher} onClose={() => setQrVoucher(null)} />
      )}
    </CustomerShell>
  );
}
