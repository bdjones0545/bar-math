import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold tracking-wide uppercase transition-[transform,background-color,color,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] select-none touch-manipulation disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:bg-fg",
        secondary:
          "bg-surface-2 text-fg border border-border hover:bg-surface",
        ghost: "bg-transparent text-muted hover:text-fg hover:bg-surface",
        danger: "bg-danger text-fg hover:opacity-90",
      },
      size: {
        lg: "h-12 px-5 text-sm rounded-3xl",
        md: "h-11 px-4 text-xs rounded-2xl",
        sm: "h-9 px-3 text-[11px] rounded-xl",
        icon: "size-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
