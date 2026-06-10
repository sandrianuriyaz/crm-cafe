import Link from "next/link";
import { History, Percent, Gift, User, type LucideIcon } from "lucide-react";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const actions: QuickAction[] = [
  { label: "Promo", href: "/promo", icon: Percent },
  { label: "Rewards", href: "/rewards", icon: Gift },
  { label: "History", href: "/history", icon: History },
  { label: "Profile", href: "/profile", icon: User },
];

export function QuickActions() {
  return (
    <nav aria-label="Aksi cepat" className="grid grid-cols-4 gap-2">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-[0px_4px_12px_rgba(43,23,18,0.05)] transition-opacity hover:opacity-80"
        >
          <Icon className="size-6 text-secondary" aria-hidden="true" />
          <span className="text-xs text-foreground">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
