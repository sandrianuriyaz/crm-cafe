"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, ChevronRight, Gift, QrCode, Star } from "lucide-react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { TIER_META } from "@/lib/loyalty/tier";
import { type Promo, type Reward } from "@/lib/loyalty/types";

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
      {/* Topbar */}
      <div className="flex h-14 items-center justify-between bg-polks-brand px-5">
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

      {/* White section: greeting + poin + member card CTA */}
      <div className="bg-white">
        {/* Greeting */}
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-[15px] font-semibold text-polks-text">Halo, {name}</p>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ backgroundColor: tierMeta.badgeBg, color: tierMeta.badgeText }}
          >
            {tierMeta.label}
          </span>
        </div>

        {/* Poin display */}
        <div className="px-5 pb-6 pt-4">
          <Star size={16} color="#F6B84B" fill="#F6B84B" />
          <p className="mt-1 text-[56px] font-black leading-none tracking-[-0.04em] text-polks-text">
            {points.toLocaleString("id-ID")}
          </p>
          <p className="mt-1 text-[12px] text-polks-muted">pts · Saldo poin kamu</p>
        </div>

        {/* Member Card CTA — ticket design */}
        <div className="px-5 pb-6">
          <Link href="/member-card" className="flex overflow-hidden rounded-2xl">
            {/* Dark left panel */}
            <div className="flex w-[80px] shrink-0 flex-col items-center justify-center gap-2 bg-polks-brand py-5">
              <QrCode size={20} className="text-white" />
              <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-white/50">SCAN QR</span>
            </div>
            {/* Perforated edge */}
            <div className="flex shrink-0 items-center bg-polks-brand px-[5px]">
              <div className="h-[calc(100%-16px)] border-l-[1.5px] border-dashed border-white/25" />
            </div>
            {/* White right panel */}
            <div className="flex flex-1 items-center justify-between bg-white px-4 py-4">
              <div>
                <p className="text-[13px] font-bold text-polks-text">Kartu Member</p>
                <p className="text-[11px] text-polks-muted">Tunjukkan QR ke kasir</p>
              </div>
              <ChevronRight size={16} className="text-polks-muted" />
            </div>
          </Link>
        </div>
      </div>

      {/* Clean separator */}
      <div className="border-b border-polks-border" />

      {/* Content */}
      <div className="flex flex-col gap-7 bg-polks-bg px-5 pb-28 pt-5">
        {/* Reward untuk kamu */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-polks-text">Reward untuk Kamu</h3>
            <Link href="/rewards" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
              Semua <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex gap-3">
            {(recs.length > 0 ? recs : [null, null]).map((r, i) => {
              const soldOut = r ? r.stock <= 0 : false;
              return (
                <Link
                  key={r?.id ?? i}
                  href="/rewards"
                  className="flex-1 rounded-2xl border border-polks-border bg-white p-4 text-left"
                >
                  <div
                    className={
                      "mb-3 flex size-9 items-center justify-center rounded-xl " +
                      (soldOut ? "bg-polks-surface" : "bg-polks-point-soft")
                    }
                  >
                    <Gift size={16} color={soldOut ? "#8A959D" : "#C99A2E"} />
                  </div>
                  {r ? (
                    <>
                      <p className="mb-1 line-clamp-1 text-xs font-semibold text-polks-text">{r.name}</p>
                      {soldOut ? (
                        <span className="text-xs font-semibold text-polks-error">Stok habis</span>
                      ) : (
                        <span className="text-xs font-semibold text-polks-muted">
                          {r.pointCost.toLocaleString("id-ID")} pts
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-2 h-3 w-2/3 rounded bg-polks-surface" />
                      <div className="h-3 w-1/3 rounded bg-polks-surface" />
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Promo */}
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
