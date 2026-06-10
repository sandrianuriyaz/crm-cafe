"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, Percent, Gift, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };

const items: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Promo", href: "/promo", icon: Percent },
  { label: "History", href: "/history", icon: History },
  { label: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-6 left-1/2 z-50 flex h-[60px] w-[85%] max-w-md -translate-x-1/2 items-center justify-around rounded-full bg-primary px-2 shadow-lg md:hidden"
    >
      <NavLink item={items[0]} active={pathname === items[0].href} />
      <NavLink item={items[1]} active={pathname === items[1].href} />

      {/* Center elevated FAB — Redeem */}
      <div className="relative -top-6 flex flex-1 justify-center">
        <Link
          href="/rewards"
          aria-label="Tukar reward"
          className="flex size-[52px] items-center justify-center rounded-full bg-accent text-white shadow-md transition-transform active:scale-95"
        >
          <Gift className="size-6" aria-hidden="true" />
        </Link>
      </div>

      <NavLink item={items[2]} active={pathname === items[2].href} />
      <NavLink item={items[3]} active={pathname === items[3].href} />
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 items-center justify-center transition-colors hover:text-white",
        active ? "text-white" : "text-cream-text/70"
      )}
    >
      <Icon className="size-6" aria-hidden="true" />
    </Link>
  );
}
