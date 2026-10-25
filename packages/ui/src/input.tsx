import * as React from "react";
import { cn } from "./lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

export const inputVariants = cva(
  "flex w-full bg-transparent px-3 py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default:
          "h-11 bg-surface/55 border border-border/60 rounded-lg backdrop-blur-lg focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-primary/20",
        secondary: "h-11 bg-accent rounded-base focus-visible:ring-primary/60",
        variant:
          "h-11 bg-secondary rounded-sm focus-visible:ring-foreground/10",
        none: "",
      },

      error: {
        true: "focus-visible:ring-destructive",
        false: "",
      },
    },

    defaultVariants: {
      variant: "default",
      error: false,
    },
  },
);

type InputProps = React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, error }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
