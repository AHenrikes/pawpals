"use client";

import * as React from "react";
import { cn } from "@/lib/helpers/utils";
import { PawPrint } from "lucide-react";
import {
  useState,
  useCallback,
  useContext,
  useMemo,
  createContext,
} from "react";

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
const SIDEBAR_WIDTH_ICON = "6rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";

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
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(max-width: 767px)");

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);

    const listener = (event: MediaQueryListEvent) => handleChange(event);
    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

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
        className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
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
      <aside
        data-slot="sidebar"
        data-side={side}
        data-variant={variant}
        data-state={state}
        data-collapsible={isCollapsed ? collapsible : ""}
        className={cn(
          "relative hidden h-svh mt-16 pt-8 shrink-0 border-r border-border/60 bg-surface-container-low/80 md:flex",
          "transition-[width] duration-200 ease-linear px-4",
          side === "left" ? "order-first" : "order-last border-r-0 border-l",
          isCollapsed && collapsible === "icon"
            ? "w-[--sidebar-width-icon]"
            : "w-[--sidebar-width]",
          variant === "floating" && "m-2 rounded-2xl border",
          className,
        )}
        {...props}
      >
        <div className="flex h-full w-full flex-col gap-4">{children}</div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          openMobile ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpenMobile(false)}
        aria-hidden="true"
      />

      <aside
        data-mobile="true"
        className={cn(
          "fixed inset-y-0 left-0 mt-16 pt-8 z-40 w-[--sidebar-width-mobile] border-r border-border bg-background transition-transform md:hidden",
          openMobile ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col rounded-xl bg-surface-container-highest/60">
          {children}
        </div>
      </aside>
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
      className={cn("mt-auto p-3", className)}
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
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2",
        className,
      )}
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
    "group/menu-button flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] transition",
    "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive && "bg-surface-container-highest text-foreground",
    className,
  );

  if (
    asChild &&
    React.isValidElement<{ className?: string; "data-active"?: string }>(
      children,
    )
  ) {
    return React.cloneElement(children, {
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
      className={cn("min-h-svh flex-1", className)}
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
    <button
      type="button"
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface-container-highest text-foreground transition hover:bg-surface-variant",
        className,
      )}
      onClick={toggleSidebar}
      {...props}
    >
      {/* <PanelLeft className="h-5 w-5" /> */}
      <PawPrint className="h-6 w-6 text-primary" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
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
