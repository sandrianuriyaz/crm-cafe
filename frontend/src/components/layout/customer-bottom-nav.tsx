"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, QrCode, Gift, User, Store, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const MEMBER_NAV = [
  { href: "/dashboard",   Icon: Home,  label: "Home",    match: ["/dashboard"] },
  { href: "/promos",      Icon: Tag,   label: "Promo",   match: ["/promos"] },
  { href: "/member-card", Icon: QrCode, label: "Card",   match: ["/member-card"] },
  { href: "/rewards",     Icon: Gift,  label: "Rewards", match: ["/rewards", "/voucher-success"] },
  { href: "/profile",     Icon: User,  label: "Profile", match: ["/profile"] },
] as const;

const GUEST_NAV = [
  { href: "/",         Icon: Home,  label: "Home",   match: ["/"] },
  { href: "/outlets",  Icon: Store, label: "Outlet", match: ["/outlets"] },
  { href: "/register", Icon: LogIn, label: "Daftar", match: ["/register", "/login"] },
] as const;

export function CustomerBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = user ? MEMBER_NAV : GUEST_NAV;

  const navW = user ? "w-[340px]" : "w-[280px]";

  return (
    <nav className={cn("fixed bottom-5 left-1/2 z-50 flex h-[60px] max-w-[calc(100%-32px)] -translate-x-1/2 items-center justify-around rounded-full bg-polks-brand px-2 shadow-[0_8px_24px_rgba(37,52,63,0.3)]", navW)}>
      {items.map((item) => {
        const active = item.match.some(
          (href) => pathname === href || pathname.startsWith(`${href}/`),
        );
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 transition-transform active:scale-95"
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full transition-colors",
                active && "bg-white/15",
              )}
            >
              <Icon
                size={20}
                className={active ? "text-white" : "text-white/45"}
                strokeWidth={active ? 2.4 : 1.8}
              />
            </span>
            <span
              className={cn(
                "text-[9px] leading-none",
                active ? "font-bold text-white" : "font-medium text-white/45",
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
