/* eslint-disable @next/next/no-img-element */
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type RewardCardProps = {
  title: string;
  points: number;
  availability?: string;
  imageSrc?: string;
  className?: string;
};

export function RewardCard({
  title,
  points,
  availability,
  imageSrc,
  className,
}: RewardCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-polks-border bg-white transition-colors hover:border-polks-smile flex flex-col",
        className
      )}
    >
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-polks-surface">
        {imageSrc ? (
          <img alt={title} src={imageSrc} className="w-full h-full object-cover" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-2xl bg-polks-point-soft">
            <Icon name="redeem" className="size-8 text-polks-point" />
          </div>
        )}
        {availability ? (
          <div className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-polks-muted shadow-sm">
            {availability}
          </div>
        ) : null}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-polks-point-soft px-2 py-1 text-[10px] font-bold text-amber-800 shadow-sm">
          <Icon name="stars" fill className="size-3.5 text-polks-point" />
          {points.toLocaleString("id-ID")} pts
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <h3 className="text-[13px] font-bold leading-5 text-polks-text">{title}</h3>
      </div>
    </div>
  );
}
