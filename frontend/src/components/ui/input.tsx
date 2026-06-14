import * as React from "react";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  iconName?: string;
  trailing?: React.ReactNode;
  action?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, iconName, trailing, action, id, className, ...props }, ref) => (
    <div className="flex flex-col gap-xs">
      {(label || action) && (
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={id} className="font-body-semibold text-body-semibold text-polks-text">
              {label}
            </label>
          )}
          {action}
        </div>
      )}
      <div className="relative">
        {iconName && (
          <Icon name={iconName} className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-polks-muted" />
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "ds-input h-12 w-full rounded-xl border border-polks-border bg-white font-body text-body text-polks-text placeholder:text-polks-muted transition-all",
            iconName ? "pl-10" : "pl-3",
            trailing ? "pr-10" : "pr-3",
            className,
          )}
          {...props}
        />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  ),
);
Input.displayName = "Input";
