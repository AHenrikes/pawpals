"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { cn } from "@/lib/helpers/utils";
import { Button } from "@repo/ui/button";
import { useUser } from "@/providers/UserProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import {
  PlusIcon,
  LogOutIcon,
  FilmIcon,
  HomeIcon,
  StoreIcon,
  InboxIcon,
  UsersIcon,
  PawPrintIcon,
  BellRingIcon,
  SettingsIcon,
  ArrowDownIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/providers/SidebarProvider";
import type { LucideIcon } from "lucide-react";
import PostModal from "@/components/dialogs/PostModal";
import { LockScreen } from "@/utils/lock-body";
import { TypographyLead, TypographySmall } from "@repo/ui/typography";
import { CardContent } from "@repo/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { toast } from "@repo/ui/sonner";
import { getInitials } from "@/utils/getInitials";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@repo/ui/collapsible";
import { CreateFursonaPanelModal } from "../dialogs/CreateFursonaPanelModal";
import { createPortal } from "react-dom";
import { Separator } from "@repo/ui/separator";

type MainNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const mainNavItems: MainNavItem[] = [
  { href: AUTH_ROUTES.HOME, label: "Home", Icon: HomeIcon },
  { href: AUTH_ROUTES.REELS, label: "Reels", Icon: FilmIcon },
  { href: AUTH_ROUTES.STORE, label: "Store", Icon: StoreIcon },
  { href: AUTH_ROUTES.MESSAGES, label: "Inbox", Icon: InboxIcon },
  { href: AUTH_ROUTES.COMMUNITY, label: "Community", Icon: UsersIcon },
  { href: AUTH_ROUTES.PAWPALS_MEET, label: "Pawpals meet", Icon: PawPrintIcon },
  { href: AUTH_ROUTES.NOTIFICATION, label: "Notification", Icon: BellRingIcon },
  { href: AUTH_ROUTES.SETTINGS, label: "Settings", Icon: SettingsIcon },
];

export default function MainNav() {
  const pathname = usePathname();

  const { signOut } = useUser();
  const { currentFursona, switchCurrentFursona, fursonas, fetchFursonas, refresh } = useUser();
  const { state, openMobile, isMobile } = useSidebar();

  const [, startTransition] = useTransition();
  const [postOpen, setPostOpen] = useState(false);
  const [isFursonasOpen, setFursonasOpen] = useState(false);
  const [isCreateFursonaOpen, setCreateFursonaOpen] = useState(false);

  const isCollapsed = isMobile ? !openMobile : state === "collapsed";

  useEffect(() => {
    if (isCollapsed) {
      setFursonasOpen(false);
    }
  }, [isCollapsed]);

  const handleSwitchFursona = async (id: string) => {
    if (currentFursona?.id === id) return null;

    startTransition(async () => {
      try {
        await switchCurrentFursona(id);
        const newCurrentFursona = fursonas.find((f) => f.id === id);
        toast(`Switched to ${newCurrentFursona?.display_name ?? "fursona"}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to switch fursona";
        toast(msg);
      }
    });
  };

  const handleFursonaCreated = () => {
    refresh();
  };

  const MAX_COUNT = 4;
  const fursonaCount = fursonas.length;

  LockScreen(isMobile && openMobile || isCreateFursonaOpen);

  return (
    <Sidebar collapsible="icon" className="group/sidebar shrink-0">
      <SidebarGroup>
        {mainNavItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href;

          return (
            <SidebarMenuItem key={label}>
              <SidebarMenuButton 
                asChild
                isActive={isActive}
                className={cn(
                  "text-text-muted",
                  isActive && "text-text"
                )}
              >
                <Link
                  href={href}
                  className="p-3"
                  draggable="false"
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 shrink-0",
                      !isActive && "opacity-60",
                    )}
                  />

                  <AnimatePresence initial={false} mode="wait">
                    {!isCollapsed && (
                      <div className="flex justify-between items-center w-full">
                        <motion.span
                          key="label"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          className={cn(
                            "truncate overflow-hidden whitespace-nowrap",
                          )}
                        >
                          {label}
                        </motion.span>

                        {/* <div className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-red-500/70" /> */}
                      </div>
                    )}
                  </AnimatePresence>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarGroup>

      <SidebarFooter className="flex flex-col gap-4">
        <Collapsible open={isFursonasOpen} onOpenChange={setFursonasOpen}>
          {isCollapsed ? (
            <SidebarMenuButton 
              disabled
              className="p-3 cursor-default hover:bg-transparent"
            >
              <PawPrintIcon className="h-6 w-6 shrink-0 text-text-muted" />
            </SidebarMenuButton>
          ) : (
            <CollapsibleTrigger
              onClick={fetchFursonas}
              disabled={isCollapsed}
              aria-label={isCollapsed ? "My fursonas" : undefined}
              className={cn(
                "w-full p-3 mt-0 rounded-sm",
                !isCollapsed ? "cursor-pointer hover:bg-secondary" : null
              )}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key="fursonas-trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex justify-between items-center w-full overflow-hidden whitespace-nowrap"
                >
                  <TypographyLead>My fursonas</TypographyLead>

                  {!isFursonasOpen ? (
                    <div className="h-fit p-1 bg-accent rounded-full">
                      <ArrowDownIcon className="h-5 w-5 shrink-0" />
                    </div>
                  ) : (
                    <TypographySmall className="text-text-muted">
                      {fursonaCount} / {MAX_COUNT}
                    </TypographySmall>
                  )}
                </motion.div>
              </AnimatePresence>
            </CollapsibleTrigger>
          )}

          <CollapsibleContent className="max-h-55 mt-3 overflow-auto scrollbar-hide">
            <CardContent className="grid grid-cols-2 auto-rows-fr p-0 gap-2.5">
              {fursonas.map((elem) => {
                const isActive = elem.id === currentFursona?.id;

                return (
                  <Button
                    key={elem.id}
                    size={"icon-lg"}
                    variant={"ghost"}
                    onClick={() => handleSwitchFursona(elem.id)}
                    className={cn(
                      "flex flex-col items-center w-full h-auto p-2.5 gap-2 rounded-sm",
                      `${isActive 
                        ? "bg-secondary border-2 border-accent"
                        : "bg-secondary-dim border-2 border-transparent text-text-muted cursor-pointer"
                      }`
                    )}
                  >
                    <Avatar size="lg">
                      <AvatarImage
                        src={`${elem?.avatar_url}`}
                        alt={elem?.display_name}
                      />

                      <AvatarFallback>{getInitials(elem?.display_name)}</AvatarFallback>
                    </Avatar>

                    <TypographySmall>
                      {elem.display_name}
                    </TypographySmall>
                  </Button>
                );
              })}

              {fursonaCount < MAX_COUNT && (
                <Button
                  size={"icon-lg"}
                  variant={"ghost"}
                  onClick={() => setCreateFursonaOpen(true)}
                  className={cn(
                    "flex flex-col items-center w-full h-auto p-2.5 gap-2.5",
                    "bg-secondary-dim text-text-muted rounded-sm"
                  )}
                >
                  <PlusIcon />
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>

        <Separator className="h-px" />

        <SidebarGroup className="flex flex-col">
          <SidebarMenuButton
            onClick={() => setPostOpen(true)}
            className="bg-primary rounded-sm hover:bg-primary-dim">
            <PlusIcon className="w-6 h-6 shrink-0" />

            <AnimatePresence initial={false} mode="wait">
              {!isCollapsed && (
                <motion.span
                  key="post-label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  POST
                </motion.span>
              )}
            </AnimatePresence>
          </SidebarMenuButton>

          <SidebarMenuButton
            onClick={() => signOut()}
            className="bg-destructive/40 rounded-sm hover:bg-destructive">
            <LogOutIcon className="w-6 h-6 p-0.5 shrink-0" />

            <AnimatePresence initial={false} mode="wait">
              {!isCollapsed && (
                <motion.span
                  key="signout-label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </SidebarMenuButton>
        </SidebarGroup>
      </SidebarFooter>

      <PostModal isOpen={postOpen} onClose={() => setPostOpen(false)} />

      {isCreateFursonaOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              className="fixed inset-0 h-svh"
            >
              <CreateFursonaPanelModal
                isOpen={isCreateFursonaOpen}
                onClose={() => setCreateFursonaOpen(false)}
                onSuccess={handleFursonaCreated}
              />
            </motion.div>
          </AnimatePresence>,
          document.body,
        )
      }
    </Sidebar>
  );
}
