import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type CustomerMobileShellProps = {
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

export function CustomerMobileShell({
  children,
  className,
  padded = true,
}: CustomerMobileShellProps) {
  return (
    <div className="min-h-dvh bg-polks-cream text-foreground">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-polks-cream shadow-[0_0_0_1px_rgba(59,29,20,0.04)]">
        <BrandTopBar />
        <main
          className={cn(
            "pb-32",
            padded && "px-5 pt-8",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function BrandTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-[67px] items-center border-b border-polks-line/80 bg-polks-cream px-6">
      <button
        type="button"
        aria-label="Buka menu"
        className="flex size-8 items-center justify-center text-foreground"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      <div className="flex-1 text-center text-[21px] font-semibold uppercase tracking-[0.03em]">
        POLKS GROUP
      </div>
      <div className="size-8" aria-hidden="true" />
    </header>
  );
}
