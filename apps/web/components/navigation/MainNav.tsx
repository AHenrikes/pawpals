"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { cn } from "@/lib/helpers/utils";
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
import { Button } from "@repo/ui/button";
import { useUser } from "@/providers/UserProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/providers/SidebarProvider";

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

  const handleSignOut = async () => {
    await signOut();
    router.push(AUTH_ROUTES.SIGN_IN);
    router.refresh();
  };

  return (
    <Sidebar
      collapsible="icon"
      className="h-[calc(100svh-64px)] group/sidebar border-transparent shrink-0"
    >
      <SidebarContent className="gap-10">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(({ href, label, Icon }) => {
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={href}
                        className="hover:bg-surface-highest"
                        draggable="false"
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            !isActive && "opacity-60",
                          )}
                        />
                        <span className="truncate group-data-[collapsible=icon]/sidebar:hidden">
                          {label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button asChild className="mt-3 h-10 w-full rounded-full">
          <div>
            <span className="group-data-[collapsible=icon]/sidebar:hidden">
              POST
            </span>
            <span className="hidden group-data-[collapsible=icon]/sidebar:inline">
              <PlusIcon className="h-5 w-5" />
            </span>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="mt-3 h-10 w-full rounded-full"
        >
          <div>
            <span className="group-data-[collapsible=icon]/sidebar:hidden">
              Sign out
            </span>
            <span className="hidden group-data-[collapsible=icon]/sidebar:inline">
              <LogOutIcon className="h-5 w-5" />
            </span>
          </div>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
