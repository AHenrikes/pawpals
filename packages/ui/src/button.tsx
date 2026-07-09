import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center p-4 text-sm font-medium whitespace-nowrap gap-2 rounded-base duration-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-text-foreground hover:bg-primary-dim",
        secondary: "bg-foreground text-text-foreground hover:bg-muted-foreground",
        destructive: "bg-accent hover:bg-destructive",
        outline: "border border-border hover:bg-surface-low",
        link: "text-primary underline-offset-4 hover:underline",
        ghost: "hover:bg-card",
        none: "",
      },
      size: {
        sm: "h-7 text-xs rounded-sm",
        default: "h-9",
        lg: "h-10 rounded-lg",
        icon: "h-fit w-fit [&_svg]:pointer-events-none [&_svg]:shrink-0",
        iconPair: "h-fit w-fit [&_svg]:pointer-events-none [&_svg]:shrink-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          {...(props as React.ComponentProps<typeof Slot>)}
        />
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
