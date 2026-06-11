"use client";

import type { ReactNode } from "react";
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
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-md h-16 w-full bg-surface border-b border-outline-variant">
        <span className="font-app-name text-app-name text-primary tracking-tight">
          POLKS GROUP
        </span>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            aria-label="Notifications"
            className="relative text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full"
          >
            <Icon name="notifications" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </button>
          <div className="flex items-center justify-center size-8 rounded-full bg-primary-container text-on-primary-container font-body-semibold text-body-semibold">
            S
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-[280px] shrink-0 bg-on-secondary-fixed sticky top-16 self-start h-[calc(100vh-4rem)] py-lg px-md border-r border-outline-variant/10">
          {/* Header block */}
          <div className="mb-xl px-2">
            <h2 className="font-body-semibold text-body-semibold text-primary-fixed">
              Admin Panel
            </h2>
            <p className="font-caption text-caption text-secondary-fixed-dim">
              Manage Loyalty
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item, index) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={`${item.label}-${index}`}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg font-body-semibold text-body-semibold transition-colors duration-200",
                    active
                      ? "text-primary-fixed bg-primary/20 border-l-4 border-primary-fixed"
                      : "text-secondary-fixed-dim hover:text-primary-fixed hover:bg-on-secondary-fixed-variant/50",
                  )}
                >
                  <Icon name={item.icon} fill={active} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-lg border-t border-outline-variant/10">
            <div className="font-app-name text-app-name text-primary-fixed px-sm">
              POLKS GROUP
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto w-full p-md md:p-lg space-y-lg">
            {title ? (
              <h1 className="font-page-title text-page-title text-on-surface">
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
