import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CustomerBottomNav } from "./customer-bottom-nav";
import { CustomerDrawer } from "./customer-drawer";

export function CustomerShell({
  children,
  topbarRight,
  drawerFooter,
  maxWidth = "",
  showHeader = true,
  showBottomNav = true,
}: {
  children: ReactNode;
  topbarRight?: ReactNode;
  drawerFooter?: ReactNode;
  maxWidth?: string;
  showHeader?: boolean;
  showBottomNav?: boolean;
}) {
  const hasDesktopNav = showBottomNav;

  return (
    <div className="min-h-screen w-full bg-polks-bg text-polks-text">
      {hasDesktopNav ? <CustomerDrawer footer={drawerFooter} /> : null}

      <div
        className={cn(
          "polks-phone relative w-full overflow-x-hidden bg-polks-bg",
          "md:min-h-screen md:max-w-none md:shadow-none",
          hasDesktopNav && "md:pl-[280px]",
        )}
      >
        {showHeader ? (
          <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-polks-brand px-5 md:hidden">
            <Image
              src="/polks/logo.png"
              alt="POLKS"
              width={88}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
            <div className="flex items-center gap-2">{topbarRight}</div>
          </header>
        ) : null}

        <main className={cn("w-full", maxWidth)}>{children}</main>

        {showBottomNav ? <CustomerBottomNav /> : null}
      </div>
    </div>
  );
}
