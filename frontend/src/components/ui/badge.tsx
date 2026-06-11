import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-1 font-caption text-caption transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
  {
    variants: {
      variant: {
        default: "bg-surface-container-high text-on-surface",
        secondary: "bg-secondary-container text-on-secondary-container",
        success: "bg-secondary-container text-on-secondary-container",
        warning: "bg-soft-gold text-deep-navy",
        error: "bg-error-container text-on-error-container",
        destructive: "bg-error-container text-on-error-container",
        outline: "border border-outline-variant text-on-surface",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
