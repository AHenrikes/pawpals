import * as React from "react";
import { cn } from "./lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

export const inputVariants = cva(
  "flex w-full bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "h-9 rounded-md border border-input",
        auth: "h-14 rounded-full border-surface bg-popover px-5 text-base text-headline shadow-ambient placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-secondary",
        popover:
          "rounded-full border-popover bg-popover px-5 text-base text-text shadow-ambient placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-secondary",
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
