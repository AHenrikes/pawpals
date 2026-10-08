import * as React from "react";
import { cn } from "./lib/utils";

export function TypographyH1({
  className,
  children,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-balance text-3xl font-extrabold leading-[1.12] tracking-tight first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function TypographyH2({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "scroll-m-20 text-2xl font-semibold leading-[1.2] tracking-tight md:text-3xl",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function TypographyH3({
  className,
  children,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "text-xl font-semibold leading-[1.3] tracking-tight md:text-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function TypographyH4({
  className,
  children,
  ...props
}: React.ComponentProps<"h4">) {
  return (
    <h4
      className={cn(
        "text-lg font-semibold leading-[1.35] tracking-tight md:text-xl",
        className,
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

export function TypographyP({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-base text-text/40 leading-7", className)}
      {...props}
    />
  );
}

export function TypographyBlockquote({
  className,
  ...props
}: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    />
  );
}

export function TypographyList({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  );
}

export function TypographyInlineCode({
  className,
  ...props
}: React.ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "relative rounded bg-surface-low p-4 font-mono text-sm font-semibold",
        className,
      )}
      {...props}
    />
  );
}

export function TypographyLead({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-lg text-foreground/80 md:text-xl", className)}
      {...props}
    />
  );
}

export function TypographyLarge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-lg font-semibold leading-7 md:text-xl", className)}
      {...props}
    />
  );
}

export function TypographySmall({
  className,
  ...props
}: React.ComponentProps<"small">) {
  return (
    <small
      className={cn("text-sm font-medium leading-6", className)}
      {...props}
    />
  );
}

export function TypographyXSmall({
  className,
  ...props
}: React.ComponentProps<"small">) {
  return <small className={cn("text-xs font-medium", className)} {...props} />;
}

export function TypographyMuted({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm leading-6 text-text-muted", className)}
      {...props}
    />
  );
}

export function TypographyTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn("w-full", className)} {...props} />
    </div>
  );
}
