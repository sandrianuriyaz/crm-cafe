import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  className?: string;
};

export function Chip({ active = false, onClick, children, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-4 font-body-semibold text-body-semibold transition-colors whitespace-nowrap",
        active ? "bg-polks-brand text-white" : "bg-white text-polks-muted border border-polks-border",
        className,
      )}
    >
      {children}
    </button>
  );
}
