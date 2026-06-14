"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, QrCode, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", Icon: Home, label: "Home", match: ["/dashboard"] },
  { href: "/promos", Icon: Tag, label: "Promo", match: ["/promos"] },
  { href: "/member-card", Icon: QrCode, label: "Card", match: ["/member-card"] },
  { href: "/rewards", Icon: Gift, label: "Rewards", match: ["/rewards", "/voucher-success"] },
  { href: "/profile", Icon: User, label: "Profile", match: ["/profile"] },
] as const;

export function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 flex h-[60px] w-[340px] max-w-[calc(100%-32px)] -translate-x-1/2 items-center justify-around rounded-full bg-polks-brand px-2 shadow-[0_8px_24px_rgba(37,52,63,0.3)]">
      {NAV_ITEMS.map((item) => {
        const active = item.match.some(
          (href) => pathname === href || pathname.startsWith(`${href}/`),
        );
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 transition-transform active:scale-95",
              active &&
                "size-[52px] -translate-y-7 justify-center rounded-full border-[5px] border-polks-bg bg-white shadow-[0_6px_16px_rgba(37,52,63,0.28)]",
            )}
          >
            <Icon
              size={active ? 20 : 18}
              className={active ? "text-polks-brand" : "text-white/50"}
              strokeWidth={active ? 2.4 : 1.8}
            />
            <span
              className={cn(
                "leading-none",
                active
                  ? "text-[8px] font-bold text-polks-brand"
                  : "text-[9px] font-medium text-white/45",
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
