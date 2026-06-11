import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary-container text-on-primary rounded-lg font-body-semibold text-body-semibold shadow-sm hover:bg-primary-container/90 active:scale-[0.98] transition-all",
        destructive:
          "bg-error text-on-error font-body-semibold text-body-semibold shadow-sm hover:bg-error/90 active:scale-[0.98]",
        outline:
          "border border-outline-variant/50 bg-surface-container-lowest text-on-surface font-body-semibold text-body-semibold hover:bg-surface-container-low",
        secondary:
          "bg-secondary-container text-on-secondary-container font-body-semibold text-body-semibold hover:bg-secondary-container/80",
        ghost: "text-primary font-body-semibold text-body-semibold hover:bg-surface-container-low",
        link: "text-primary font-body-semibold text-body-semibold underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-4",
        sm: "h-9 rounded-lg px-3 text-caption",
        lg: "h-12 rounded-lg px-8",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
