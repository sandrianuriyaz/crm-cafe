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
        "bg-surface rounded-xl border border-outline-variant overflow-hidden group hover:border-primary transition-colors flex flex-col",
        className
      )}
    >
      <div className="h-40 bg-surface-container-high relative overflow-hidden flex items-center justify-center">
        {imageSrc ? (
          <img alt={title} src={imageSrc} className="w-full h-full object-cover" />
        ) : (
          <Icon name="local_mall" className="size-16 text-on-surface-variant opacity-40" />
        )}
        {availability ? (
          <div className="absolute top-sm left-sm bg-surface-container-lowest text-on-surface-variant font-label-xs text-label-xs px-sm py-xs rounded-full shadow-sm">
            {availability}
          </div>
        ) : null}
        <div className="absolute top-sm right-sm bg-surface-container-lowest text-primary font-label-xs text-label-xs px-sm py-xs rounded-full shadow-sm flex items-center gap-xs">
          <Icon name="paid" className="size-3.5" />
          {points.toLocaleString("id-ID")} pts
        </div>
      </div>
      <div className="p-md flex-1 flex flex-col justify-between">
        <h3 className="font-card-title text-card-title text-on-surface">{title}</h3>
      </div>
    </div>
  );
}
