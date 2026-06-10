import { Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Placeholder thumbnail for deals/rewards.
 * Swap for next/image once real product photos are available.
 */
export function OfferThumbnail({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 text-secondary",
        className
      )}
      aria-hidden="true"
    >
      <Coffee className="size-7" />
    </div>
  );
}
