import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { CustomerBottomNav } from "./customer-bottom-nav";
import { CustomerDrawer } from "./customer-drawer";

export function CustomerShell({
  children,
  topbarRight,
  drawerFooter,
  maxWidth = "max-w-7xl",
}: {
  children: ReactNode;
  topbarRight?: ReactNode;
  drawerFooter?: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="bg-background text-on-background min-h-screen pb-[100px] md:pb-0 md:pl-[280px]">
      <CustomerDrawer footer={drawerFooter} />

      <header className="md:hidden flex items-center justify-between px-md h-16 w-full bg-surface border-b border-outline-variant sticky top-0 z-30">
        <div className="flex items-center gap-sm cursor-pointer active:opacity-80">
          <Icon name="menu" className="text-primary" />
        </div>
        <h1 className="font-app-name text-app-name text-primary tracking-tight">
          POLKS GROUP
        </h1>
        <div className="flex gap-sm">{topbarRight}</div>
      </header>

      <main className={cn("w-full mx-auto p-md md:p-lg", maxWidth)}>
        {children}
      </main>

      <CustomerBottomNav />
    </div>
  );
}
