"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Gift,
  Home,
  Tag,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };

const items: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Promo", href: "/promo", icon: Tag },
  { label: "Member", href: "/member-card", icon: CreditCard },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi loyalty"
      className="fixed bottom-6 left-1/2 z-50 grid h-[74px] w-[calc(100%-56px)] max-w-[360px] -translate-x-1/2 grid-cols-5 items-center rounded-full bg-polks-espresso px-3 shadow-[0_12px_30px_rgba(47,22,15,0.24)]"
    >
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={pathname === item.href || (item.href === "/dashboard" && pathname === "/")}
        />
      ))}
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className="flex min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#9d7b72] transition-colors hover:text-white"
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          active && "bg-polks-caramel text-white shadow-[0_8px_18px_rgba(174,92,0,0.28)]"
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className={cn("leading-none", active ? "text-white" : "text-[#9d7b72]")}>
        {item.label}
      </span>
    </Link>
  );
}
