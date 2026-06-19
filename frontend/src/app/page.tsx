"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  QrCode,
  Tag,
  Gift,
  Store,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Star,
  Home,
  LogIn,
} from "lucide-react";
import { LoginRequiredModal } from "@/components/customer/login-required-modal";
import { api } from "@/lib/api";
import { type Promo, type Reward } from "@/lib/loyalty/types";

type Outlet = { id: string; name: string; city: string | null };

const steps = [
  { Icon: Smartphone, text: "Tunjukkan QR member ke kasir" },
  { Icon: Star, text: "Poin masuk otomatis tiap transaksi" },
  { Icon: Gift, text: "Tukar poin jadi reward pilihan" },
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
  { label: "Promo", Icon: Tag, href: "/login" as const },
  { label: "Masuk", Icon: QrCode, href: "/login" as const },
  { label: "Reward", Icon: Gift, href: "/login" as const },
  { label: "Daftar", Icon: LogIn, href: "/register" as const },
];

export default function GuestHomePage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [modalReason, setModalReason] = useState<string | null>(null);
  const gate = (reason: string) => () => setModalReason(reason);

  useEffect(() => {
    // Endpoint publik — guest tetap dapat data asli.
    api<Promo[]>("/promos").then((d) => setPromos(d.slice(0, 5))).catch(() => setPromos([]));
    api<Reward[]>("/rewards").then((d) => setRewards(d.slice(0, 3))).catch(() => setRewards([]));
    api<Outlet[]>("/outlets").then((d) => setOutlets(d.slice(0, 4))).catch(() => setOutlets([]));
  }, []);

  const promo = promos[activeBanner];

  return (
    <div className="polks-phone relative w-full overflow-x-hidden bg-polks-bg font-body text-polks-text">
      {/* Topbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-polks-brand px-4 py-3">
        <Image
          src="/polks/logo.png"
          alt="POLKS"
          width={96}
          height={40}
          className="h-8 w-auto object-contain"
          priority
        />
        <button
          type="button"
          onClick={gate("Login untuk membuka member card & QR kamu.")}
          className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 text-xs font-semibold text-white"
        >
          <QrCode size={14} />
          QR Member
        </button>
      </div>

      {/* Promo banner (data asli) */}
      <div className="bg-polks-brand px-3.5 pb-4">
        <Link
          href="/login"
          className="block overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.07]"
        >
          {promo?.imageUrl ? (
            <div className="relative aspect-[16/9] w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={promo.imageUrl} alt={promo.title} className="size-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-4 pt-10">
                <h2 className="text-[20px] font-bold leading-tight text-white">{promo.title}</h2>
                <p className="text-xs text-white/70">{formatPeriod(promo.startAt, promo.endAt)}</p>
              </div>
            </div>
          ) : (
            <div className="px-5 pb-4 pt-[22px]">
              <span className="mb-2.5 inline-block rounded-full bg-white/[0.12] px-2.5 py-[3px] text-[9px] font-medium uppercase tracking-[0.08em] text-white/70">
                {promo ? "Promo Aktif" : "POLKS Loyalty"}
              </span>
              <h2 className="mb-1.5 text-[22px] font-bold leading-tight tracking-[-0.01em] text-white">
                {promo ? promo.title : "Kumpulkan poin tiap kunjungan"}
              </h2>
              <p className="text-xs text-white/50">
                {promo
                  ? formatPeriod(promo.startAt, promo.endAt)
                  : "Daftar gratis & tukar poin dengan reward."}
              </p>
            </div>
          )}
        </Link>
        {promos.length > 1 ? (
          <div className="flex justify-center gap-1.5 pt-3">
            {promos.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => setActiveBanner(i)}
                className={
                  "h-[5px] rounded-full transition-all " +
                  (i === activeBanner ? "w-[18px] bg-white" : "w-[5px] bg-white/25")
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* White section */}
      <div className="bg-white">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-4 py-3.5">
          <div>
            <p className="text-xs text-[#8A959D]">Selamat datang,</p>
            <p className="text-[15px] font-bold text-polks-text">Teman POLKS!</p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-full bg-polks-brand px-5 text-[13px] font-bold text-white"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Content sections */}
      <div className="bg-polks-bg pt-3">
        {/* Reward Catalog (data asli) */}
        <div className="mx-4 mb-3 rounded-[20px] bg-white px-5 py-5 shadow-[0_4px_20px_rgba(37,52,63,0.05)]">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-polks-text">Reward Catalog</h3>
            <Link href="/login" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
              Lihat Semua <ChevronRight size={13} />
            </Link>
          </div>
          {rewards.length === 0 ? (
            <p className="py-2 text-[13px] text-[#8A959D]">Belum ada reward tersedia.</p>
          ) : (
            <div className="flex flex-col">
              {rewards.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={gate("Login untuk menukar poin dengan reward.")}
                  className={
                    "flex w-full items-center justify-between py-3 text-left " +
                    (i < rewards.length - 1 ? "border-b border-polks-surface" : "")
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-polks-bg">
                      <Gift size={17} color="#25343F" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-polks-text">{r.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#8A959D]">
                        {r.pointCost.toLocaleString("id-ID")} pts · All Outlets
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#C0CBD3" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cara Kerjanya */}
        <div className="mx-4 mb-3 rounded-[20px] bg-white px-5 py-5 shadow-[0_4px_20px_rgba(37,52,63,0.05)]">
          <h3 className="mb-4 text-[15px] font-bold text-polks-text">Cara Kerjanya</h3>
          <div className="flex flex-col gap-3.5">
            {steps.map(({ Icon, text }, i) => (
              <div key={text} className="flex items-center gap-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-polks-bg">
                  <Icon size={15} color="#25343F" strokeWidth={1.8} />
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-polks-brand text-[9px] font-medium text-white">
                    {i + 1}
                  </span>
                  <span className="text-[13px] text-polks-text">{text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outlet (data asli) */}
        {outlets.length > 0 ? (
          <div className="mx-4 mb-3 rounded-[20px] bg-white px-5 py-5 shadow-[0_4px_20px_rgba(37,52,63,0.05)]">
            <h3 className="mb-3.5 text-[15px] font-bold text-polks-text">Lokasi Outlet</h3>
            {outlets.map((o, i) => (
              <div
                key={o.id}
                className={
                  "flex items-center justify-between py-[11px] " +
                  (i < outlets.length - 1 ? "border-b border-polks-surface" : "")
                }
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-polks-brand">
                    <Store size={15} color="#ffffff" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-polks-text">{o.name}</p>
                    {o.city ? <p className="mt-px text-[11px] text-[#8A959D]">{o.city}</p> : null}
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-polks-brand px-2.5 py-1 text-[10px] font-bold text-white">
                  Buka
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {/* CTA daftar */}
        <div className="mx-4 mb-3 rounded-[20px] bg-polks-brand px-5 py-7 text-center">
          <h3 className="mb-2 text-[17px] font-bold text-white">
            Mulai kumpulkan poin hari ini.
          </h3>
          <p className="mb-[18px] text-[13px] leading-relaxed text-white/50">
            Daftar gratis dan dapatkan poin dari setiap kunjungan di semua outlet POLKS.
          </p>
          <Link
            href="/register"
            className="flex h-[50px] w-full items-center justify-center rounded-[14px] bg-white text-sm font-bold text-polks-brand"
          >
            Daftar Gratis
          </Link>
          <Link
            href="/login"
            className="mt-2.5 inline-block text-[13px] text-white/45"
          >
            Sudah punya akun? Login
          </Link>
        </div>

        {/* Value props */}
        <div className="mx-4 mb-3 rounded-[20px] bg-white px-5 py-4 shadow-[0_4px_20px_rgba(37,52,63,0.05)]">
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

        <div className="h-28" />
      </div>

      {/* Bottom nav (guest) */}
      <nav className="fixed bottom-5 left-1/2 z-50 flex h-[60px] w-[340px] max-w-[calc(100%-32px)] -translate-x-1/2 items-center justify-around rounded-full bg-polks-brand px-2 shadow-[0_8px_24px_rgba(37,52,63,0.3)]">
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
