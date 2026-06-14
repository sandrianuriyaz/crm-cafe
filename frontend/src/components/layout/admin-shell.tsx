"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Members", href: "/admin/members", icon: "group" },
  { label: "Transactions", href: "/admin/transactions", icon: "receipt_long" },
  { label: "Campaigns", href: "/admin/config", icon: "campaign" },
  { label: "Analytics", href: "/admin", icon: "analytics" },
  { label: "Settings", href: "/admin/config", icon: "settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-polks-bg text-polks-text">
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-polks-border bg-white px-5">
        <Image src="/polks/logo.png" alt="POLKS" width={92} height={42} className="h-8 w-auto rounded bg-polks-brand px-2 py-1" />
        <div className="flex items-center gap-sm">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 text-polks-muted transition-colors hover:bg-polks-surface"
          >
            <Icon name="notifications" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </button>
          <div className="flex size-8 items-center justify-center rounded-full bg-polks-brand font-body-semibold text-body-semibold text-white">
            S
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[280px] shrink-0 flex-col self-start border-r border-polks-border bg-polks-brand px-4 py-6 md:flex">
          <div className="mb-xl px-2">
            <h2 className="font-body-semibold text-body-semibold text-white">
              Admin Panel
            </h2>
            <p className="font-caption text-caption text-white/45">
              Manage Loyalty
            </p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item, index) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={`${item.label}-${index}`}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 font-body-semibold text-body-semibold transition-colors duration-200",
                    active
                      ? "bg-white/12 text-polks-point"
                      : "text-white/55 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon name={item.icon} fill={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <div className="px-2 font-app-name text-app-name text-white">
              POLKS GROUP
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-6">
            {title ? (
              <h1 className="font-page-title text-page-title text-polks-text">
                {title}
              </h1>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
