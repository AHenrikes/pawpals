import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./lib/utils";

const itemVariants = cva(
  "group/item relative flex w-full items-center gap-3 rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:bg-accent/60",
        outline: "border border-border bg-background hover:bg-accent/40",
        muted: "bg-muted/50 hover:bg-muted",
      },
      size: {
        default: "min-h-14 px-3 py-2",
        sm: "min-h-12 px-2.5 py-2",
        xs: "min-h-10 px-2 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const itemGroupVariants = cva(
  "overflow-hidden rounded-xl border border-border bg-background",
);

const itemMediaVariants = cva(
  "inline-flex shrink-0 items-center justify-center text-muted-foreground [&_img]:h-full [&_img]:w-full [&_img]:object-cover",
  {
    variants: {
      variant: {
        default: "h-10 w-10 rounded-md",
        icon: "h-9 w-9 rounded-md border border-border bg-muted/40 [&_svg]:h-4 [&_svg]:w-4",
        image: "h-10 w-10 overflow-hidden rounded-md",
        avatar: "h-10 w-10 overflow-hidden rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type ItemProps = React.ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & {
    asChild?: boolean;
  };

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(itemVariants({ variant, size, className }))}
          {...(props as React.ComponentProps<typeof Slot>)}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(itemVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Item.displayName = "Item";

const ItemGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(itemGroupVariants(), className)} {...props} />
  ),
);
ItemGroup.displayName = "ItemGroup";

const ItemSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-px w-full bg-border", className)}
    {...props}
  />
));
ItemSeparator.displayName = "ItemSeparator";

const ItemHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground",
      className,
    )}
    {...props}
  />
));
ItemHeader.displayName = "ItemHeader";

const ItemFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-3 py-2", className)} {...props} />
));
ItemFooter.displayName = "ItemFooter";

type ItemMediaProps = React.ComponentProps<"div"> &
  VariantProps<typeof itemMediaVariants>;

const ItemMedia = React.forwardRef<HTMLDivElement, ItemMediaProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(itemMediaVariants({ variant }), className)}
      {...props}
    />
  ),
);
ItemMedia.displayName = "ItemMedia";

const ItemContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("min-w-0 flex-1", className)} {...props} />
));
ItemContent.displayName = "ItemContent";

const ItemTitle = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("truncate text-sm font-medium leading-none", className)}
    {...props}
  />
));
ItemTitle.displayName = "ItemTitle";

const ItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("truncate text-xs text-muted-foreground", className)}
    {...props}
  />
));
ItemDescription.displayName = "ItemDescription";

const ItemActions = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-auto inline-flex items-center gap-2", className)}
    {...props}
  />
));
ItemActions.displayName = "ItemActions";

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
};
