"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/member-card", icon: "qr_code_2", label: "Member Card" },
  { href: "/rewards", icon: "redeem", label: "Reward" },
  { href: "/history", icon: "history", label: "Riwayat" },
  { href: "/profile", icon: "person", label: "Profil" },
] as const;

export function CustomerDrawer({ footer }: { footer?: ReactNode }) {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col border-r border-white/10 bg-polks-brand px-5 py-6 md:flex">
      <div className="mb-8">
        <Image
          src="/polks/logo.png"
          alt="POLKS"
          width={112}
          height={52}
          className="h-10 w-auto object-contain"
          priority
        />
        <p className="mt-3 text-xs font-medium text-white/40">
          Loyalty & Rewards
        </p>
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 duration-200",
                  isActive
                    ? "bg-white/12 text-polks-point"
                    : "text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon name={item.icon} fill={isActive} className="size-5" />
                <span className="text-sm font-semibold">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {footer ? (
        <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-6">
          {footer}
        </div>
      ) : null}
    </nav>
  );
}
