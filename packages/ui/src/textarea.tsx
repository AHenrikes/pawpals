import * as React from "react";
import { cn } from "./lib/utils";

type TextareaProps = React.ComponentProps<"textarea">;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-24 w-full resize-none rounded-lg border border-border/60 bg-surface/55 px-3 py-2 text-base shadow-xs backdrop-blur-lg transition-colors placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
