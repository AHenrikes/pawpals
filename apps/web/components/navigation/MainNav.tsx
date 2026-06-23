"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { cn } from "@/lib/helpers/utils";
import { Button } from "@repo/ui/button";
import { useUser } from "@/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState } from "react";
import {
  Home,
  PawPrint,
  Settings,
  Store,
  Users,
  BellRing,
  Inbox,
  PlusIcon,
  LogOutIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/providers/SidebarProvider";
import type { LucideIcon } from "lucide-react";
import PostModal from "@/components/dialogs/PostModal";

type MainNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const mainNavItems: MainNavItem[] = [
  { href: AUTH_ROUTES.HOME, label: "Home", Icon: Home },
  { href: AUTH_ROUTES.STORE, label: "Store", Icon: Store },
  { href: AUTH_ROUTES.MESSAGES, label: "Inbox", Icon: Inbox },
  { href: AUTH_ROUTES.COMMUNITY, label: "Community", Icon: Users },
  { href: AUTH_ROUTES.PAWPALS_MEET, label: "Pawpals meet", Icon: PawPrint },
  { href: AUTH_ROUTES.NOTIFICATION, label: "Notification", Icon: BellRing },
  { href: AUTH_ROUTES.SETTINGS, label: "Settings", Icon: Settings },
];

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useUser();
  const { state, openMobile, isMobile } = useSidebar();

  const [postOpen, setPostOpen] = useState(false);

  const isCollapsed = isMobile ? !openMobile : state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="group/sidebar border-transparent shrink-0"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(({ href, label, Icon }) => {
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild isActive={isActive} className="">
                      <Link
                        href={href}
                        className="hover:bg-surface-highest p-3"
                        draggable="false"
                      >
                        <Icon
                          className={cn(
                            "h-6 w-6  shrink-0",
                            !isActive && "opacity-60",
                          )}
                        />

                        <AnimatePresence initial={false} mode="wait">
                          {!isCollapsed && (
                            <motion.span
                              key="label"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: "auto" }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.15, ease: "easeInOut" }}
                              className="truncate overflow-hidden whitespace-nowrap"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="flex flex-col px-1">
        <Button
          onClick={() => setPostOpen(true)}
          className={cn(
            "mt-3 h-10 rounded-full shadow-none",
            !isCollapsed && "w-full",
          )}
        >
          <PlusIcon className="h-6 w-6 shrink-0" />

          <AnimatePresence initial={false} mode="wait">
            {!isCollapsed && (
              <motion.span
                key="post-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="overflow-hidden whitespace-nowrap"
              >
                POST
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        <Button
          variant="outline"
          onClick={() => signOut()}
          className={cn("mt-3 h-10 rounded-full", !isCollapsed && "w-full")}
        >
          <LogOutIcon className="h-6 w-6 p-[2px] shrink-0" />

          <AnimatePresence initial={false} mode="wait">
            {!isCollapsed && (
              <motion.span
                key="signout-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="overflow-hidden whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </SidebarFooter>

      <PostModal isOpen={postOpen} onClose={() => setPostOpen(false)} />
    </Sidebar>
  );
}
