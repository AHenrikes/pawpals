"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { Home, PawPrint, Settings, Store, Users, BellRing, Inbox, ArrowBigRight } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@repo/ui/item";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/providers/SidebarProvider";

type MainNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
};

const mainNavItems: MainNavItem[] = [
  { href: AUTH_ROUTES.HOME, label: "Home", Icon: Home },
  { href: AUTH_ROUTES.STORE, label: "Store", Icon: Store },
  { href: AUTH_ROUTES.INBOX, label: "Inbox", Icon: Inbox },
  { href: AUTH_ROUTES.COMMUNITY, label: "Community", Icon: Users },
  { href: AUTH_ROUTES.PAWPAL_MEET, label: "Pawpal meet", Icon: PawPrint },
  { href: AUTH_ROUTES.NOTIFICATION, label: "Notification", Icon: BellRing },
  { href: AUTH_ROUTES.SETTINGS, label: "Settings", Icon: Settings },
];

const profileItems = [
  { name: "Profile 1", subtitle: "Main" },
  { name: "Profile 2", subtitle: "Personal" },
  { name: "Profile 3", subtitle: "Family" },
  { name: "Profile 4", subtitle: "Work" },
];

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useSupabaseClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(AUTH_ROUTES.SIGN_IN);
    router.refresh();
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <Sidebar collapsible="icon" className="group/sidebar">
      <SidebarHeader>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent className="gap-10">
        <SidebarGroup>
          <SidebarGroupLabel>Placeholder</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(({ href, label, Icon }) => {
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={href}>
                        <Icon className="h-5 w-5 shrink-0" />
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

        <SidebarGroup>
          <SidebarGroupLabel className="pb-2">Accounts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="group-data-[collapsible=icon]/sidebar:hidden">
                  <ItemGroup className="flex flex-col border-0 rounded-none bg-transparent gap-4">
                    {profileItems.map((profile) => (

                      <Item key={profile.name} className="rounded-sm pl-4 cursor-pointer hover:bg-primary-foreground" variant={"outline"}>
                        <ItemMedia variant="avatar">
                          <Avatar>
                            <AvatarImage
                              src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(profile.name)}`}
                              alt={profile.name}
                            />
                            <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                          </Avatar>
                        </ItemMedia>

                        <ItemContent>
                          <ItemTitle>{profile.name}</ItemTitle>
                          <ItemDescription>{profile.subtitle}</ItemDescription>
                        </ItemContent>

                        <ItemActions>
                          <Button variant={"ghost"} size={"icon"}>
                            <ArrowBigRight />
                          </Button>
                        </ItemActions>
                      </Item>
                    ))}
                  </ItemGroup>
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button
          asChild
          className="h-11 w-full rounded-full text-base font-semibold group-data-[collapsible=icon]/sidebar:px-0 hover:bg-secondary cursor-pointer"
        >
          <div>
            <span className="group-data-[collapsible=icon]/sidebar:hidden">POST</span>
            <span className="hidden group-data-[collapsible=icon]/sidebar:inline">+</span>
          </div>
        </Button>

        <div className="group-data-[collapsible=icon]/sidebar:hidden">
          <Button onClick={handleSignOut} variant="outline" className="mt-3 h-10 w-full rounded-full">
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
