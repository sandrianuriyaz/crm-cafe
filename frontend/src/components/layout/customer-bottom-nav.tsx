"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/member-card", icon: "account_balance_wallet", label: "Wallet" },
  { href: "/rewards", icon: "stars", label: "Rewards" },
  { href: "/profile", icon: "person", label: "Profile" },
] as const;

export function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-base left-1/2 -translate-x-1/2 w-[320px] z-50 flex justify-around items-center px-4 py-2 bg-on-secondary-fixed rounded-full shadow-lg">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 scale-95 active:scale-90 transition-transform",
              isActive
                ? "text-tertiary-fixed-dim bg-on-tertiary-fixed-variant rounded-full"
                : "text-secondary-fixed-dim hover:text-primary-fixed transition-all"
            )}
          >
            <Icon name={item.icon} fill={isActive} />
            <span className="font-label-xs text-label-xs mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
