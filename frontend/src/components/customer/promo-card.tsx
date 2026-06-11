/* eslint-disable @next/next/no-img-element */
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type PromoCardProps = {
  title: string;
  description: string;
  badge?: string;
  imageSrc?: string;
  className?: string;
};

export function PromoCard({ title, description, badge, imageSrc, className }: PromoCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden flex flex-col group cursor-pointer hover:border-primary transition-colors",
        className
      )}
    >
      <div className="w-full h-40 bg-surface-container-high relative overflow-hidden">
        {imageSrc ? (
          <img
            alt={title}
            src={imageSrc}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="local_activity" className="size-16 text-on-surface-variant opacity-40" />
          </div>
        )}
        {badge ? (
          <div className="absolute top-sm right-sm bg-surface-container-lowest px-2 py-1 rounded-md border border-outline-variant shadow-sm">
            <span className="font-caption text-caption text-primary">{badge}</span>
          </div>
        ) : null}
      </div>
      <div className="p-md flex flex-col gap-xs flex-1">
        <h4 className="font-card-title text-card-title text-on-surface line-clamp-1">{title}</h4>
        <p className="font-body text-body text-on-surface-variant line-clamp-2">{description}</p>
      </div>
    </div>
  );
}
