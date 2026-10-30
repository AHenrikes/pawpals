"use client";

import { cn } from "@/lib/helpers/utils";
import { PawPrint } from "lucide-react";
import { motion } from "framer-motion";
import {
  useState,
  useCallback,
  useContext,
  useMemo,
  createContext,
  isValidElement,
  cloneElement,
} from "react";
import { Button } from "@repo/ui/button";
import useIsMobile from "@/hooks/useIsMobile";

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const SIDEBAR_WIDTH = "20rem";
const SIDEBAR_WIDTH_ICON = "4.75rem";
const SIDEBAR_WIDTH_MOBILE = "min(20rem, calc(100vw - 1rem))";

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }

  return context;
}

type SidebarProviderProps = React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SidebarProvider({
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}: SidebarProviderProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const [openMobile, setOpenMobile] = useState(false);
  const isMobile = useIsMobile();

  const open = openProp ?? openState;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(nextOpen);
        return;
      }

      setOpenState(nextOpen);
    },
    [onOpenChange],
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
      return;
    }

    setOpen(!open);
  }, [isMobile, open, setOpen]);

  const contextValue = useMemo<SidebarContextValue>(
    () => ({
      state: open ? "expanded" : "collapsed",
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [isMobile, open, openMobile, setOpen, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-provider"
        data-state={contextValue.state}
        className={cn("group/sidebar-wrapper flex w-full", className)}
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

type SidebarProps = React.ComponentProps<"aside"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "icon",
  className,
  children,
  ...props
}: SidebarProps) {
  const { state, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = collapsible !== "none" && state === "collapsed";

  return (
    <>
      <motion.aside
        data-slot="sidebar"
        data-side={side}
        data-variant={variant}
        data-state={state}
        data-collapsible={isCollapsed ? collapsible : ""}
        animate={{ width: isCollapsed ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "sticky top-16 hidden h-[calc(100svh-65px)] shrink-0 overflow-hidden border-r border-white/10 bg-background/65 px-3 py-4 shadow-xl shadow-black/5 backdrop-blur-2xl md:flex lg:px-4",
          side === "left" ? "order-first" : "order-last border-r-0 border-l",
          variant === "floating" && "m-2 rounded-2xl border",
          className,
        )}
        {...(props as React.ComponentProps<typeof motion.aside>)}
      >
        <div className="flex h-full w-full flex-col gap-4">{children}</div>
      </motion.aside>

      {openMobile && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/50 transition-opacity md:hidden"
          onClick={() => setOpenMobile(false)}
          aria-hidden="true"
        />
      )}

      <motion.aside
        data-mobile="true"
        data-side={side}
        data-variant={variant}
        data-state={openMobile ? "expanded" : "collapsed"}
        className={cn(
          "group/sidebar fixed top-16 z-50 h-[calc(100svh-64px)] w-(--sidebar-width-mobile) border-r border-white/10 bg-background p-2 transition-transform duration-200 md:hidden",
          openMobile ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col rounded-xl bg-secondary-dim/60 p-2">
          {children}
        </div>
      </motion.aside>
    </>
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("p-3", className)}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("mt-auto", className)}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn("flex flex-1 flex-col gap-2 overflow-y-auto", className)}
      {...props}
    />
  );
}

export function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="sidebar-group"
      className={cn("space-y-2", className)}
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="sidebar-group-label"
      className={cn(
        "px-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground",
        "group-data-[collapsible=icon]/sidebar:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("space-y-1", className)}
      {...props}
    />
  );
}

export function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("space-y-1", className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("list-none", className)}
      {...props}
    />
  );
}

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
};

export function SidebarMenuButton({
  asChild = false,
  isActive,
  className,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const sharedClassName = cn(
    "group/menu-button flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px] rounded-xl transition",
    "cursor-pointer hover:bg-secondary hover:text-text",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
    isActive &&
      "border border-primary/25 bg-primary/15 text-foreground shadow-sm shadow-primary/10 hover:bg-primary/20",
    className,
  );

  if (
    asChild &&
    isValidElement<{ className?: string; "data-active"?: string }>(children)
  ) {
    return cloneElement(children, {
      className: cn(sharedClassName, children.props.className),
      "data-active": isActive ? "true" : "false",
    });
  }

  return (
    <button
      className={sharedClassName}
      data-active={isActive ? "true" : "false"}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">) {
  const { state } = useSidebar();

  return (
    <main
      data-slot="sidebar-inset"
      data-state={state}
      className={cn("flex flex-1", className)}
      {...props}
    />
  );
}

export function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      size={"icon"}
      variant={"none"}
      type="button"
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full text-text cursor-pointer",
        className,
      )}
      onClick={toggleSidebar}
      {...props}
    >
      <PawPrint className="text-primary" aria-hidden="true" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export function SidebarRail({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      aria-label="Toggle sidebar"
      className={cn(
        "absolute inset-y-0 -right-2 hidden w-4 cursor-col-resize rounded-full border border-border/60 bg-surface-container-highest/70 sm:flex",
        className,
      )}
      onClick={toggleSidebar}
      {...props}
    />
  );
}
