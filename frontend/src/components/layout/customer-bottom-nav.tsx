"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, QrCode, Gift, User, Store, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

// Satu standar strokeWidth untuk semua icon navbar — sebelumnya beda antara
// state aktif (2.4) dan nonaktif (1.8) yang bikin transisi terasa inkonsisten.
const NAV_ICON_STROKE = 1.8;

// "Card" (kartu member/QR) selalu tampil "pop up" keluar dari bar sejak awal
// (bukan cuma saat aktif) — ini tombol utama app, pola tombol tengah yang
// selalu menonjol seperti di Alfagift/Dana.
const MEMBER_NAV = [
  { href: "/dashboard",   Icon: Home,  label: "Home",    match: ["/dashboard"], popup: false },
  { href: "/promos",      Icon: Tag,   label: "Promo",   match: ["/promos"], popup: false },
  { href: "/member-card", Icon: QrCode, label: "Card",   match: ["/member-card"], popup: true },
  { href: "/rewards",     Icon: Gift,  label: "Rewards", match: ["/rewards", "/voucher-success"], popup: false },
  { href: "/profile",     Icon: User,  label: "Profile", match: ["/profile"], popup: false },
] as const;

const GUEST_NAV = [
  { href: "/",         Icon: Home,  label: "Home",   match: ["/"], popup: false },
  { href: "/outlets",  Icon: Store, label: "Outlet", match: ["/outlets"], popup: false },
  { href: "/register", Icon: LogIn, label: "Daftar", match: ["/register", "/login"], popup: false },
] as const;

export function CustomerBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = user ? MEMBER_NAV : GUEST_NAV;

  return (
    <nav className="fixed inset-x-0 bottom-0 left-1/2 z-50 flex h-16 w-full max-w-[430px] -translate-x-1/2 items-center justify-around rounded-t-2xl bg-polks-brand px-2 shadow-[0_-4px_16px_rgba(37,52,63,0.18)]">
      {items.map((item) => {
        const active = item.match.some(
          (href) => pathname === href || pathname.startsWith(`${href}/`),
        );
        const Icon = item.Icon;

        // Tombol "Card" selalu pop up sejak awal, terlepas dari route aktif.
        // Tab lain flat di dalam bar — cuma warna yang beda saat aktif.
        if (item.popup) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex h-full flex-1 flex-col items-center justify-center gap-1 transition-transform active:scale-95"
            >
              <span
                className={cn(
                  "absolute -top-4 left-1/2 flex size-12 -translate-x-1/2 items-center justify-center rounded-full bg-polks-card shadow-[0_6px_14px_rgba(23,33,42,0.35)] transition-colors",
                  active && "ring-2 ring-white/40",
                )}
              >
                <Icon size={22} className="text-polks-brand" strokeWidth={NAV_ICON_STROKE} />
              </span>
              {/* Spacer transparan seukuran icon tab lain — icon asli ada di
                  bubble absolute di atas, ini cuma supaya label "Card" ikut
                  ke-center persis sejajar dengan label tab lain. */}
              <span className="size-[19px]" aria-hidden="true" />
              <span className={cn("text-[9px] leading-none", active ? "font-bold text-white" : "font-medium text-white/55")}>
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex h-full flex-1 flex-col items-center justify-center gap-1 transition-transform active:scale-95"
          >
            <Icon
              size={19}
              className={active ? "text-white" : "text-white/55"}
              strokeWidth={NAV_ICON_STROKE}
            />
            <span
              className={cn(
                "text-[9px] leading-none",
                active ? "font-bold text-white" : "font-medium text-white/55",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
