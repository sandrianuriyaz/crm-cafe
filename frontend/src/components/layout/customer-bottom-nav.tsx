"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "home", label: "Home", match: ["/dashboard"] },
  { href: "/dashboard#promo", icon: "sell", label: "Promo", match: [] },
  { href: "/member-card", icon: "qr_code_2", label: "Card", match: ["/member-card"] },
  { href: "/rewards", icon: "redeem", label: "Rewards", match: ["/rewards", "/voucher-success"] },
  { href: "/profile", icon: "person", label: "Profile", match: ["/profile"] },
] as const;

export function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 flex h-[78px] w-[350px] max-w-[calc(100%-40px)] -translate-x-1/2 items-center justify-around rounded-full bg-polks-brand px-4 shadow-[0_16px_34px_rgba(37,52,63,0.34)] md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = item.match.some(
          (href) => pathname === href || pathname.startsWith(`${href}/`),
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex w-[58px] flex-col items-center justify-center text-center transition-transform active:scale-95",
              isActive
                ? "-translate-y-6 text-white"
                : "translate-y-1 text-white/42 hover:text-white/75",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center transition-all",
                isActive
                  ? "size-[74px] rounded-full border-[6px] border-polks-bg bg-white text-polks-brand shadow-[0_12px_24px_rgba(37,52,63,0.3)]"
                  : "size-8 text-white/42",
              )}
            >
              <Icon name={item.icon} fill={isActive} className={isActive ? "size-7" : "size-6"} />
            </span>
            <span
              className={cn(
                "mt-1 text-[11px] font-bold leading-3",
                isActive ? "text-white" : "text-white/42",
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
