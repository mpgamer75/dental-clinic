"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg font-body font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-out-quart",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Primary action. One per view. */
        default:
          "bg-terracotta text-primary-foreground shadow-e1 hover:bg-terracotta-hover hover:shadow-e2",
        /** Alias kept so existing call sites don't break. */
        cta: "bg-terracotta text-primary-foreground shadow-e1 hover:bg-terracotta-hover hover:shadow-e2",
        /** Brass — the primary action *on* a drenched band, where terracotta
            on terracotta would disappear. Carries ink, not white (AA). */
        brass:
          "bg-brass text-brass-on shadow-e2 hover:bg-brass-ink hover:text-brass-on hover:shadow-e3",
        /** Secondary action on a drenched band. */
        onDrench:
          "border border-drench-on/30 bg-transparent text-drench-on hover:border-drench-on/60 hover:bg-drench-on/10",
        destructive:
          "bg-destructive text-destructive-foreground shadow-e1 hover:brightness-110",
        outline:
          "border border-line-strong bg-transparent text-ink hover:border-terracotta/50 hover:bg-terracotta-soft hover:text-terracotta",
        secondary:
          "bg-canvas-sunk text-ink hover:bg-line/60",
        ghost: "text-ink hover:bg-canvas-sunk",
        link: "h-auto p-0 text-terracotta underline-offset-4 hover:underline",
      },
      size: {
        /* Hit targets >= 44px throughout (WCAG 2.2 AA, elder-friendly). */
        default: "h-11 px-5 text-[0.95rem]",
        sm: "h-11 px-3.5 text-sm",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-8 text-base",
        icon: "h-11 w-11",
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
  /** Shows a spinner and blocks interaction. Width is held so the button
      doesn't jump when the label is swapped out. */
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    // `asChild` forwards to a single child (e.g. a <Link>); injecting a spinner
    // there would break Slot's single-child contract.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <Loader2 className="absolute h-5 w-5 animate-spin" aria-hidden="true" />
        )}
        <span
          className={cn(
            "inline-flex items-center gap-2",
            loading && "invisible"
          )}
        >
          {children}
        </span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
