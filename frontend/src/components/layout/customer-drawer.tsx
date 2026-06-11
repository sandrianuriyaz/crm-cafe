"use client";

import type { ReactNode } from "react";
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

export function CustomerDrawer({ footer }: { footer?: ReactNode }) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 py-lg px-md w-[280px] z-40 bg-on-secondary-fixed border-r border-outline-variant/10">
      <div className="mb-xl">
        <h1 className="font-app-name text-app-name text-primary-fixed tracking-tight">
          POLKS GROUP
        </h1>
      </div>
      <ul className="flex flex-col gap-sm flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-md px-md py-sm rounded-lg cursor-pointer duration-200",
                  isActive
                    ? "text-primary-fixed bg-primary/20 border-l-4 border-primary-fixed"
                    : "text-secondary-fixed-dim hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/50 transition-colors"
                )}
              >
                <Icon name={item.icon} fill={isActive} />
                <span className="font-body-semibold text-body-semibold">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {footer ? (
        <div className="mt-auto flex flex-col gap-sm pt-lg border-t border-outline-variant/10">
          {footer}
        </div>
      ) : null}
    </nav>
  );
}
