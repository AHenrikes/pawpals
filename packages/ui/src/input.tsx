import * as React from "react";
import { cn } from "./lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

export const inputVariants = cva(
  "flex w-full bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "h-9 rounded-base border border-input",
        secondary:
          "h-9 bg-foreground text-text-foreground rounded-base shadow-md focus-visible:ring-border",
        input: "h-9 bg-input rounded-base shadow-md focus-visible:ring-2",
        popover:
          "h-9 rounded-full border-popover bg-popover px-4 shadow-ambient focus-visible:ring-2 focus-visible:ring-secondary",
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
