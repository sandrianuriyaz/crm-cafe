"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Store, Tag, Gift, Ticket, Webhook,
  RefreshCw, History, Settings, Radio, LogOut, Bell, Search,
  Menu, X, Zap, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  Icon: typeof LayoutDashboard;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const STANDALONE: NavItem = {
  label: "Overview",
  href: "/admin",
  Icon: LayoutDashboard,
};

const GROUPS: NavGroup[] = [
  {
    label: "Manajemen",
    items: [
      { label: "Members", href: "/admin/members", Icon: Users },
      { label: "Outlets", href: "/admin/outlets", Icon: Store },
    ],
  },
  {
    label: "Loyalty",
    items: [
      { label: "Promotions", href: "/admin/promos", Icon: Tag },
      { label: "Rewards", href: "/admin/rewards", Icon: Gift },
      { label: "Vouchers", href: "/admin/vouchers", Icon: Ticket },
      { label: "Loyalty Config", href: "/admin/config", Icon: Settings },
    ],
  },
  {
    label: "Aktivitas",
    items: [
      { label: "POS Transactions", href: "/admin/transactions", Icon: Zap },
      { label: "Redeem History", href: "/admin/redeem-history", Icon: History },
    ],
  },
  {
    label: "Sistem",
    items: [
      { label: "Broadcast", href: "/admin/broadcast", Icon: Radio },
      { label: "POS Sync", href: "/admin/pos-sync", Icon: RefreshCw },
      { label: "Webhook Inbox", href: "/admin/webhook", Icon: Webhook },
    ],
  },
];

const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/admin/settings",
  Icon: Settings,
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    GROUPS.forEach((g) => {
      if (g.items.some((item) => isActive(pathname, item.href))) {
        initial.add(g.label);
      }
    });
    return initial;
  });

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  // Proteksi: hanya ADMIN. Selain itu tendang ke login admin.
  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.replace("/admin/login");
    }
  }, [loading, user, router]);

  function handleLogout() {
    logout();
    router.replace("/admin/login");
  }

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-polks-bg">
        <span className="text-sm text-polks-muted">Memuat…</span>
      </div>
    );
  }

  const adminInitial = (user.name?.trim()[0] || "A").toUpperCase();

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex min-h-[65px] flex-shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
        <Image src="/polks/logo.png" alt="POLKS" width={84} height={32} className="h-7 w-auto object-contain" />
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="text-white/50 md:hidden"
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-5 pb-1 pt-2.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">Admin Panel</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {/* Overview — standalone */}
        <Link
          href={STANDALONE.href}
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "mb-0.5 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition-colors",
            isActive(pathname, STANDALONE.href) ? "bg-white/[0.12]" : "hover:bg-white/[0.06]",
          )}
        >
          <STANDALONE.Icon
            size={16}
            className={isActive(pathname, STANDALONE.href) ? "text-white" : "text-white/50"}
          />
          <span
            className={cn(
              "whitespace-nowrap text-[13px]",
              isActive(pathname, STANDALONE.href) ? "font-bold text-white" : "font-medium text-white/55",
            )}
          >
            {STANDALONE.label}
          </span>
        </Link>

        {/* Accordion groups */}
        {GROUPS.map((group) => {
          const isOpen = openGroups.has(group.label);
          return (
            <div key={group.label} className="mb-0.5">
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
              >
                <span className="flex-1 text-left text-[9px] font-bold uppercase tracking-[0.1em] text-white/30">
                  {group.label}
                </span>
                <ChevronRight
                  size={12}
                  className={cn(
                    "text-white/30 transition-transform duration-200",
                    isOpen && "rotate-90",
                  )}
                />
              </button>
              {isOpen && (
                <div className="mt-0.5">
                  {group.items.map(({ label, href, Icon }) => {
                    const active = isActive(pathname, href);
                    return (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "mb-0.5 flex items-center gap-2.5 rounded-[10px] py-2.5 pl-5 pr-3 transition-colors",
                          active ? "bg-white/[0.12]" : "hover:bg-white/[0.06]",
                        )}
                      >
                        <Icon size={16} className={active ? "text-white" : "text-white/50"} />
                        <span
                          className={cn(
                            "whitespace-nowrap text-[13px]",
                            active ? "font-bold text-white" : "font-medium text-white/55",
                          )}
                        >
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="flex-shrink-0 border-t border-white/[0.07] px-2 py-3">
        {/* Settings standalone */}
        <Link
          href={SETTINGS_ITEM.href}
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "mb-0.5 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 transition-colors",
            isActive(pathname, SETTINGS_ITEM.href) ? "bg-white/[0.12]" : "hover:bg-white/[0.06]",
          )}
        >
          <SETTINGS_ITEM.Icon
            size={16}
            className={isActive(pathname, SETTINGS_ITEM.href) ? "text-white" : "text-white/50"}
          />
          <span
            className={cn(
              "whitespace-nowrap text-[13px]",
              isActive(pathname, SETTINGS_ITEM.href) ? "font-bold text-white" : "font-medium text-white/55",
            )}
          >
            {SETTINGS_ITEM.label}
          </span>
        </Link>
        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 hover:bg-white/[0.06]"
        >
          <LogOut size={16} className="text-white/40" />
          <span className="text-[13px] font-medium text-white/40">Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-polks-bg">
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] min-w-[220px] flex-col overflow-hidden bg-polks-brand md:flex">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[260px] overflow-y-auto bg-polks-brand md:hidden">
            <Sidebar />
          </div>
        </>
      ) : null}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-polks-border bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden"
              aria-label="Buka menu"
            >
              <Menu size={20} className="text-polks-brand" />
            </button>
            {title ? <h1 className="text-[15px] font-bold text-polks-text">{title}</h1> : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden items-center md:flex">
              <Search size={13} className="absolute left-2.5 text-[#8A959D]" />
              <input
                placeholder="Search..."
                className="h-[34px] w-[200px] rounded-[10px] border-[1.5px] border-polks-border bg-polks-bg pl-7 pr-3 text-xs text-polks-text outline-none"
              />
            </div>
            <button type="button" aria-label="Notifikasi" className="relative">
              <Bell size={18} className="text-polks-muted" />
              <span className="absolute -right-0.5 -top-0.5 size-[7px] rounded-full border-[1.5px] border-white bg-polks-brand" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-polks-brand text-xs font-extrabold text-polks-point">
                {adminInitial}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold leading-tight text-polks-text">{user.name || "Admin"}</p>
                <p className="text-[10px] text-[#8A959D]">POLKS Group</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
