import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  title: string;
  value: string;
  iconName: string;
  /** Trend delta label, e.g. "12%", "2", or "-" when no trend */
  delta?: string;
  /** Drives the delta color + arrow icon */
  deltaTone?: "up" | "down" | "neutral";
  /** Tint the icon circle gold (used for points/stars cards) */
  accent?: "primary" | "gold";
  className?: string;
};

export function StatCard({
  title,
  value,
  iconName,
  delta,
  deltaTone = "neutral",
  accent = "primary",
  className,
}: StatCardProps) {
  const showArrow = deltaTone === "up" || deltaTone === "down";

  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 hover:border-primary/50 transition-colors flex flex-col justify-between h-32",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            "p-2 rounded-lg",
            accent === "gold"
              ? "bg-soft-gold text-gold"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon name={iconName} className="size-5" fill={accent === "gold"} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-page-title text-page-title text-on-surface">
          {value}
        </span>
        {delta ? (
          <span
            className={cn(
              "font-caption text-caption flex items-center gap-0.5",
              deltaTone === "up"
                ? "text-emerald-600"
                : deltaTone === "down"
                  ? "text-error"
                  : "text-on-surface-variant",
            )}
          >
            {showArrow ? (
              <Icon
                name={deltaTone === "up" ? "arrow_upward" : "arrow_downward"}
                className="size-3.5"
              />
            ) : null}
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
