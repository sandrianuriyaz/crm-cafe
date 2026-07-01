"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2, ChevronRight, Gift, Home, LogIn, MapPin, Smartphone, Star, Store,
} from "lucide-react";
import { LoginRequiredModal } from "@/components/customer/login-required-modal";
import { PromoBanner } from "@/components/customer/promo-banner";
import { api } from "@/lib/api";
import { type Promo, type Reward } from "@/lib/loyalty/types";

type Outlet = {
  id: string;
  name: string;
  city: string | null;
};

const HOW_IT_WORKS = [
  { Icon: Smartphone, text: "Tunjukkan QR member ke kasir" },
  { Icon: Star,       text: "Poin masuk otomatis tiap transaksi" },
  { Icon: Gift,       text: "Tukar poin jadi reward pilihan" },
];

const VALUE_PROPS = [
  "Daftar gratis — tanpa kartu fisik",
  "Berlaku di semua outlet POLKS",
  "Poin otomatis update setelah transaksi",
];

const navItems = [
  { label: "Home",   Icon: Home,   href: "/" as const   },
  { label: "Outlet", Icon: Store,  href: "/outlets" as const },
  { label: "Daftar", Icon: LogIn,  href: "/register" as const },
];

export default function GuestHomePage() {
  const [promos,  setPromos]  = useState<Promo[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [modalReason, setModalReason] = useState<string | null>(null);
  const gate = (reason: string) => () => setModalReason(reason);

  useEffect(() => {
    api<Promo[]>("/promos")
      .then((d) => setPromos(d.filter((p) => p.status === "ACTIVE").slice(0, 5)))
      .catch(() => setPromos([]));
    api<Reward[]>("/rewards")
      .then((d) => setRewards(d.slice(0, 4)))
      .catch(() => setRewards([]));
    api<Outlet[]>("/outlets")
      .then((d) => setOutlets(d.slice(0, 4)))
      .catch(() => setOutlets([]));
  }, []);

  const carouselPromos = promos.filter((p) => p.imageUrl);

  return (
    <div className="polks-phone relative w-full overflow-x-hidden bg-polks-bg font-body text-polks-text">

      {/* ── Banner + logo overlay ──────────────────────────────────────────
          top-[12px] = PromoBanner mt-3(12px), no more CUP_ABOVE offset
          inset-x-4  = matches PromoBanner mx-4                           */}
      <div className="relative">
        <PromoBanner />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center px-4 py-2.5">
          <Image
            src="/polks/icon.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-auto drop-shadow"
            priority
          />
          <span className="ml-1.5 text-[16px] font-black tracking-[-0.02em] text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.35)]">
            POLKS
          </span>
        </div>
      </div>

      {/* ── Join CTA ── */}
      <div className="bg-white px-5 py-5">
        <p className="text-[19px] font-black leading-[1.2] tracking-[-0.02em] text-polks-text">
          Kumpulkan poin dari<br />setiap cangkir.
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-polks-muted">
          Daftar gratis & poin otomatis masuk tiap kunjungan di outlet POLKS.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/register"
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-polks-brand text-[13px] font-bold text-white"
          >
            Daftar Gratis
          </Link>
          <Link
            href="/login"
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-polks-border text-[13px] font-bold text-polks-text"
          >
            Masuk
          </Link>
        </div>
      </div>

      <div className="border-t border-polks-border" />

      {/* ── Content ── */}
      <div className="flex flex-col gap-5 pb-28 pt-5">

        {/* Cara Kerjanya */}
        <div className="mx-4 rounded-2xl bg-white px-5 py-5">
          <h2 className="mb-4 text-[14px] font-bold text-polks-text">Cara Kerjanya</h2>
          <div className="flex flex-col gap-3.5">
            {HOW_IT_WORKS.map(({ Icon, text }, i) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-polks-brand text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[13px] text-polks-text">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo */}
        {carouselPromos.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between px-4">
              <h2 className="text-[14px] font-bold text-polks-text">Promo</h2>
              <Link
                href="/login"
                className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand"
              >
                Semua <ChevronRight size={12} />
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden">
              {carouselPromos.map((p) => (
                <Link
                  key={p.id}
                  href="/login"
                  className="relative w-[140px] shrink-0 overflow-hidden rounded-xl"
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

        {/* Reward */}
        {rewards.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between px-4">
              <h2 className="text-[14px] font-bold text-polks-text">Reward</h2>
              <button
                type="button"
                onClick={gate("Login untuk melihat semua reward.")}
                className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand"
              >
                Semua <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden">
              {rewards.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={gate("Login untuk menukar poin dengan reward.")}
                  className="flex w-[130px] shrink-0 flex-col gap-2.5 rounded-2xl border border-polks-border bg-white p-3.5 text-left"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-polks-point-soft">
                    <Gift size={14} color="#C99A2E" />
                  </div>
                  <p className="line-clamp-2 text-[11px] font-semibold text-polks-text">{r.name}</p>
                  <span className="text-[10px] font-semibold text-polks-muted">
                    {r.pointCost.toLocaleString("id-ID")} pts
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Outlet */}
        {outlets.length > 0 && (
          <div className="mx-4 rounded-2xl bg-white px-5 py-4">
            <h2 className="mb-3 text-[14px] font-bold text-polks-text">Outlet Kami</h2>
            {outlets.map((o, i) => (
              <div
                key={o.id}
                className={
                  "flex items-center gap-3 py-2.5 " +
                  (i < outlets.length - 1 ? "border-b border-polks-surface" : "")
                }
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-polks-brand">
                  <MapPin size={14} color="#ffffff" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-polks-text">{o.name}</p>
                  {o.city && <p className="mt-px text-[11px] text-polks-muted">{o.city}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Value props */}
        <div className="mx-4 rounded-2xl bg-white px-5 py-4">
          {VALUE_PROPS.map((text, i) => (
            <div
              key={text}
              className={
                "flex items-center gap-2.5 py-2.5 " +
                (i < VALUE_PROPS.length - 1 ? "border-b border-polks-surface" : "")
              }
            >
              <CheckCircle2 size={15} className="shrink-0 text-polks-brand" strokeWidth={2} />
              <span className="text-[13px] text-polks-text">{text}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── Bottom nav (3 item pill) ── */}
      <nav className="fixed bottom-5 left-1/2 z-50 flex h-[60px] w-[280px] max-w-[calc(100%-32px)] -translate-x-1/2 items-center justify-around rounded-full bg-polks-brand px-2 shadow-[0_8px_24px_rgba(37,52,63,0.3)]">
        {navItems.map(({ label, Icon, href }, i) => {
          const active = i === 0;
          return (
            <Link key={label} href={href} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={
                  "flex size-9 items-center justify-center rounded-full " +
                  (active ? "bg-white/15" : "")
                }
              >
                <Icon
                  size={20}
                  color={active ? "#ffffff" : "rgba(255,255,255,0.5)"}
                  strokeWidth={active ? 2.4 : 1.8}
                />
              </span>
              <span
                className={
                  active
                    ? "text-[9px] font-bold text-white"
                    : "text-[9px] font-medium text-white/40"
                }
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <LoginRequiredModal
        open={modalReason !== null}
        onClose={() => setModalReason(null)}
        reason={modalReason ?? undefined}
      />
    </div>
  );
}
