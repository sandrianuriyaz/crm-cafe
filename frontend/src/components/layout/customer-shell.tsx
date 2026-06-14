import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CustomerBottomNav } from "./customer-bottom-nav";

export function CustomerShell({
  children,
  topbarRight,
  maxWidth,
  showHeader = true,
  showBottomNav = true,
}: {
  children: ReactNode;
  topbarRight?: ReactNode;
  /** @deprecated tidak dipakai — lebar dikunci ke frame ponsel */
  maxWidth?: string;
  drawerFooter?: ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
}) {
  return (
    <div
      className={cn(
        "polks-phone relative w-full overflow-x-hidden bg-polks-bg",
        maxWidth,
      )}
    >
      {showHeader ? (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-polks-brand px-5">
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

      <main className="w-full">{children}</main>

      {showBottomNav ? <CustomerBottomNav /> : null}
    </div>
  );
}
