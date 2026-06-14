"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  QrCode,
  Tag,
  Gift,
  Store,
  Info,
  CheckCircle2,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Smartphone,
  ScanLine,
  Link2,
  Star,
  Home,
  LogIn,
} from "lucide-react";

const banners = [
  { id: 1, title: "Diskon Kopi Susu 20%", sub: "Berlaku di semua outlet · s/d 30 Jun 2026", tag: "Promo Aktif" },
  { id: 2, title: "Buy 1 Get 1 Latte", sub: "Cafe A only · s/d 20 Jun 2026", tag: "Terbatas" },
  { id: 3, title: "Weekend Coffee Deal", sub: "Semua outlet · 21–22 Jun 2026", tag: "Segera" },
];

const promos = [
  { id: 1, title: "Diskon Kopi Susu 20%", period: "1–30 Jun 2026", outlet: "All Outlets", status: "active" as const },
  { id: 2, title: "Buy 1 Get 1 Latte", period: "15–20 Jun 2026", outlet: "Cafe A only", status: "limited" as const },
];

const rewards = [
  { id: 1, title: "Free Americano", pts: 500, outlet: "All Outlets" },
  { id: 2, title: "Voucher Rp25.000", pts: 1000, outlet: "All Outlets" },
];

const outlets = [
  { name: "Cafe A", city: "Bandung" },
  { name: "Cafe B", city: "Tasikmalaya" },
  { name: "Cafe C", city: "Jakarta" },
];

const steps = [
  { Icon: ShoppingBag, text: "Pesan di kasir / POS" },
  { Icon: Smartphone, text: "Tunjukkan QR member" },
  { Icon: ScanLine, text: "Kasir scan QR" },
  { Icon: Link2, text: "POS kirim transaksi ke CRM" },
  { Icon: Star, text: "POLKS tambahkan poin resmi" },
  { Icon: Gift, text: "Tukar poin dengan reward" },
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

const navItems = [
  { label: "Home", Icon: Home, href: "/" as const },
  { label: "Promo", Icon: Tag, href: "/login" as const },
  { label: "Masuk", Icon: QrCode, href: "/login" as const },
  { label: "Reward", Icon: Gift, href: "/login" as const },
  { label: "Daftar", Icon: LogIn, href: "/register" as const },
];

export default function GuestHomePage() {
  const [activeBanner, setActiveBanner] = useState(0);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-polks-bg font-body text-polks-text">
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
        <Link
          href="/login"
          className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 text-xs font-semibold text-white"
        >
          <QrCode size={14} />
          QR Member
        </Link>
      </div>

      {/* Promo banner */}
      <div className="bg-polks-brand px-3.5 pb-4">
        <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.07]">
          <div className="px-5 pb-4 pt-[22px]">
            <span className="mb-2.5 inline-block rounded-full bg-white/[0.12] px-2.5 py-[3px] text-[9px] font-medium uppercase tracking-[0.08em] text-white/70">
              {banners[activeBanner].tag}
            </span>
            <h2 className="mb-1.5 text-[22px] font-bold leading-tight tracking-[-0.01em] text-white">
              {banners[activeBanner].title}
            </h2>
            <p className="text-xs text-white/50">{banners[activeBanner].sub}</p>
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
                  (i === activeBanner ? "w-[18px] bg-white" : "w-[5px] bg-white/25")
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* White section */}
      <div className="bg-white">
        {/* Greeting + Login */}
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

        {/* 2-col CTA */}
        <div className="grid grid-cols-2 gap-2.5 px-3.5 pt-3.5">
          <Link href="/login" className="rounded-2xl bg-polks-brand p-4 text-left">
            <div className="mb-2.5 flex size-[38px] items-center justify-center rounded-xl bg-white/[0.12]">
              <Tag size={18} color="#ffffff" strokeWidth={2} />
            </div>
            <p className="text-[13px] font-bold text-white">Promo</p>
            <p className="text-[11px] text-white/45">Lihat penawaran</p>
          </Link>
          <Link href="/login" className="rounded-2xl bg-polks-bg p-4 text-left">
            <div className="mb-2.5 flex size-[38px] items-center justify-center rounded-xl bg-polks-surface">
              <Gift size={18} color="#17212A" strokeWidth={2} />
            </div>
            <p className="text-[13px] font-bold text-polks-text">Reward</p>
            <p className="text-[11px] text-[#8A959D]">Tukar poin</p>
          </Link>
        </div>

        {/* 4-col shortcuts */}
        <div className="grid grid-cols-4 gap-1.5 px-3.5 pb-[18px] pt-3.5">
          {[
            { label: "Outlet", Icon: Store, href: "/login" as const },
            { label: "Daftar", Icon: QrCode, href: "/register" as const },
            { label: "Info", Icon: Info, href: "/login" as const },
            { label: "Tentang", Icon: CheckCircle2, href: "/login" as const },
          ].map(({ label, Icon, href }) => (
            <Link key={label} href={href} className="flex flex-col items-center gap-1.5">
              <div className="flex size-[50px] items-center justify-center rounded-2xl bg-polks-bg">
                <Icon size={20} color="#25343F" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-semibold text-polks-muted">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="bg-polks-bg">
        {/* Promo Aktif */}
        <div className="mb-2 bg-white px-4 py-[18px]">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-polks-text">Promo Aktif</h3>
            <Link href="/login" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
              Lihat Semua <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col">
            {promos.map((p, i) => (
              <div
                key={p.id}
                className={
                  "flex items-center justify-between py-3 " +
                  (i < promos.length - 1 ? "border-b border-polks-surface" : "")
                }
              >
                <div className="flex-1 pr-3">
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

        {/* Reward Catalog */}
        <div className="mb-2 bg-white px-4 py-[18px]">
          <div className="mb-3.5 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-polks-text">Reward Catalog</h3>
            <Link href="/login" className="flex items-center gap-0.5 text-xs font-semibold text-polks-brand">
              Lihat Semua <ChevronRight size={13} />
            </Link>
          </div>
          <div className="flex flex-col">
            {rewards.map((r, i) => (
              <Link
                key={r.id}
                href="/login"
                className={
                  "flex items-center justify-between py-3 " +
                  (i < rewards.length - 1 ? "border-b border-polks-surface" : "")
                }
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-polks-bg">
                    <Gift size={17} color="#25343F" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-polks-text">{r.title}</p>
                    <p className="mt-0.5 text-[11px] text-[#8A959D]">
                      {r.pts} pts · {r.outlet}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} color="#C0CBD3" />
              </Link>
            ))}
          </div>
        </div>

        {/* Cara Kerjanya */}
        <div className="mb-2 bg-white px-4 py-[18px]">
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

        {/* Outlet */}
        <div className="mb-2 bg-white px-4 py-[18px]">
          <h3 className="mb-3.5 text-[15px] font-bold text-polks-text">Lokasi Outlet</h3>
          {outlets.map((o, i) => (
            <div
              key={o.name}
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
                  <p className="mt-px text-[11px] text-[#8A959D]">{o.city}</p>
                </div>
              </div>
              <StatusPill status="active" />
            </div>
          ))}
        </div>

        {/* CTA daftar */}
        <div className="bg-polks-brand px-4 py-7 text-center">
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
        <div className="bg-white px-4 py-4">
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
              className={
                "flex flex-col items-center gap-0.5 " +
                (active
                  ? "-mt-8 size-[52px] justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(37,52,63,0.25)]"
                  : "")
              }
            >
              <Icon
                size={active ? 20 : 18}
                color={active ? "#25343F" : "rgba(255,255,255,0.5)"}
                strokeWidth={active ? 2 : 1.6}
              />
              <span
                className={
                  active
                    ? "text-[8px] font-bold text-polks-brand"
                    : "text-[9px] font-medium text-white/40"
                }
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
