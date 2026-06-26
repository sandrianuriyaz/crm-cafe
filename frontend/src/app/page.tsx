"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Gift, Store, CheckCircle2, ChevronRight,
  Star, Home, LogIn,
} from "lucide-react";
import { LoginRequiredModal } from "@/components/customer/login-required-modal";
import { api } from "@/lib/api";
import { type Promo, type Reward } from "@/lib/loyalty/types";

type Outlet = { id: string; name: string; city: string | null };

const steps = [
  { text: "Tunjukkan QR member ke kasir" },
  { text: "Poin masuk otomatis tiap transaksi" },
  { text: "Tukar poin jadi reward pilihan" },
];

function formatPeriod(startAt: string | null, endAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  if (startAt && endAt) return `${fmt(startAt)} – ${fmt(endAt)}`;
  if (endAt) return `s/d ${fmt(endAt)}`;
  if (startAt) return `mulai ${fmt(startAt)}`;
  return "Berlaku terus";
}

const navItems = [
  { label: "Home", Icon: Home, href: "/" as const },
  { label: "Outlet", Icon: Store, href: "/outlets" as const },
  { label: "Daftar", Icon: LogIn, href: "/register" as const },
];

export default function GuestHomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [modalReason, setModalReason] = useState<string | null>(null);
  const gate = (reason: string) => () => setModalReason(reason);

  useEffect(() => {
    api<Promo[]>("/promos").then((d) => setPromos(d.slice(0, 5))).catch(() => setPromos([]));
    api<Reward[]>("/rewards").then((d) => setRewards(d.slice(0, 4))).catch(() => setRewards([]));
    api<Outlet[]>("/outlets").then((d) => setOutlets(d.slice(0, 4))).catch(() => setOutlets([]));
  }, []);

  return (
    <div className="polks-phone relative w-full overflow-x-hidden bg-polks-bg font-body text-polks-text">
      {/* Topbar */}
      <div className="sticky top-0 z-40 flex h-14 items-center bg-polks-brand px-5">
        <Image
          src="/polks/logo.png"
          alt="POLKS"
          width={96}
          height={40}
          className="h-8 w-auto object-contain"
          priority
        />
      </div>

      {/* Hero */}
      <div className="bg-white pb-10">
        {/* Headline + cup split */}
        <div className="flex items-end px-6 pt-8">
          <div className="flex-1 pr-3">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-polks-muted">
              FOLKS · COFFEE · COMMUNITY
            </p>
            <h1 className="text-[34px] font-black leading-[1.1] tracking-[-0.03em] text-polks-text">
              Poin dari<br />setiap<br />cangkir.
            </h1>
          </div>
          <div className="relative h-[190px] w-[140px] shrink-0">
            <Image
              src="/polks/cup.png"
              alt="POLKS Cup"
              fill
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>

        {/* Subtitle + CTAs */}
        <div className="px-6 pt-5">
          <p className="text-[14px] leading-relaxed text-polks-muted">
            Daftar gratis & kumpulkan poin dari setiap kunjungan di outlet POLKS.
          </p>
          <Link
            href="/register"
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-polks-brand text-[15px] font-bold text-white"
          >
            Daftar Gratis
          </Link>
          <p className="mt-3 text-center text-[13px] text-polks-muted">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-polks-brand">
              Masuk
            </Link>
          </p>
        </div>
      </div>

      {/* Brand tagline strip */}
      <div className="bg-polks-brand py-3">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
          GOOD COFFEE · GOOD PEOPLE · GREAT MOMENTS
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 bg-polks-bg pb-28 pt-5">
        {/* Promo */}
        {promos.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between px-5">
              <h2 className="text-[15px] font-bold text-polks-text">Promo</h2>
              <Link href="/login" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
                Semua <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto px-5 pb-1 [&::-webkit-scrollbar]:hidden">
              {promos.map((p) => (
                <Link
                  key={p.id}
                  href="/login"
                  className="w-[220px] flex-shrink-0 overflow-hidden rounded-2xl border border-polks-border bg-white"
                >
                  {p.imageUrl ? (
                    <div className="relative aspect-[4/3] w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.title} className="size-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-6">
                        <p className="truncate text-[12px] font-bold text-white">{p.title}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="mb-1 line-clamp-2 text-[13px] font-semibold text-polks-text">{p.title}</p>
                      <p className="text-[11px] text-polks-muted">{formatPeriod(p.startAt, p.endAt)}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Cara Kerjanya */}
        <div className="mx-5 overflow-hidden rounded-2xl bg-polks-brand px-5 py-5">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
            Cara Kerjanya
          </p>
          <div className="flex flex-col gap-4">
            {steps.map(({ text }, i) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[13px] text-white/75">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reward */}
        {rewards.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between px-5">
              <h2 className="text-[15px] font-bold text-polks-text">Reward</h2>
              <button
                type="button"
                onClick={gate("Login untuk melihat semua reward.")}
                className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand"
              >
                Semua <ChevronRight size={13} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto px-5 pb-1 [&::-webkit-scrollbar]:hidden">
              {rewards.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={gate("Login untuk menukar poin dengan reward.")}
                  className="flex w-[140px] shrink-0 flex-col gap-2.5 rounded-2xl border border-polks-border bg-white p-4 text-left"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-polks-point-soft">
                    <Gift size={16} color="#C99A2E" />
                  </div>
                  <p className="line-clamp-2 text-[12px] font-semibold text-polks-text">{r.name}</p>
                  <span className="text-[11px] font-semibold text-polks-muted">
                    {r.pointCost.toLocaleString("id-ID")} pts
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Outlet */}
        {outlets.length > 0 ? (
          <div className="mx-5 rounded-2xl bg-white px-5 py-5">
            <h2 className="mb-3.5 text-[15px] font-bold text-polks-text">Outlet Kami</h2>
            {outlets.map((o, i) => (
              <div
                key={o.id}
                className={
                  "flex items-center gap-3 py-2.5 " +
                  (i < outlets.length - 1 ? "border-b border-polks-surface" : "")
                }
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-polks-brand">
                  <Store size={15} color="#ffffff" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-polks-text">{o.name}</p>
                  {o.city ? <p className="mt-px text-[11px] text-polks-muted">{o.city}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Value props */}
        <div className="mx-5 rounded-2xl bg-white px-5 py-4">
          {[
            "Daftar gratis — tanpa kartu fisik",
            "Berlaku di semua outlet POLKS",
            "Poin otomatis update setelah transaksi",
          ].map((text, i) => (
            <div
              key={text}
              className={
                "flex items-center gap-2.5 py-2.5 " +
                (i < 2 ? "border-b border-polks-surface" : "")
              }
            >
              <CheckCircle2 size={15} color="#25343F" strokeWidth={2} />
              <span className="text-[13px] text-polks-text">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav (3 item) */}
      <nav className="fixed bottom-5 left-1/2 z-50 flex h-[60px] w-[280px] max-w-[calc(100%-32px)] -translate-x-1/2 items-center justify-around rounded-full bg-polks-brand px-2 shadow-[0_8px_24px_rgba(37,52,63,0.3)]">
        {navItems.map(({ label, Icon, href }, i) => {
          const active = i === 0;
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-1 flex-col items-center gap-1"
            >
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
