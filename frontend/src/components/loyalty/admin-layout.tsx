import type { ReactNode } from "react";
import { BarChart3, Gift, LayoutDashboard, Users } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Members", icon: Users },
  { label: "Rewards", icon: Gift },
  { label: "Reports", icon: BarChart3 },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-sidebar px-4 py-6 lg:block">
        <div className="px-3 text-lg font-bold uppercase tracking-wide text-polks-espresso">
          POLKS CRM
        </div>
        <nav className="mt-8 space-y-1" aria-label="Admin navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <a
              key={label}
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-polks-caramel">
              Loyalty Admin
            </p>
            <h1 className="text-lg font-semibold">POLKS GROUP CRM</h1>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
