"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";
import { Home, PawPrint, Settings, Store, Users, BellRing, Inbox, PlusIcon, LogOutIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { useUser } from "@/hooks/useUser";
import {
  Item,
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
  { href: AUTH_ROUTES.HOME, label: "Home", Icon: Home},
  { href: AUTH_ROUTES.STORE, label: "Store", Icon: Store},
  { href: AUTH_ROUTES.MESSAGES, label: "Inbox", Icon: Inbox},
  { href: AUTH_ROUTES.COMMUNITY, label: "Community", Icon: Users},
  { href: AUTH_ROUTES.PAWPAL_MEET, label: "Pawpal meet", Icon: PawPrint},
  { href: AUTH_ROUTES.NOTIFICATION, label: "Notification", Icon: BellRing},
  { href: AUTH_ROUTES.SETTINGS, label: "Settings", Icon: Settings},
];

export default function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { fursonas, error, signOut } = useUser();
  const fursonaError = error?.message ?? null;

  const handleSignOut = async () => {
    await signOut();
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
    <Sidebar collapsible="icon" className="h-[calc(100svh-64px)] pt-6 group/sidebar border-transparent">
      <SidebarContent className="gap-10">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(({ href, label, Icon }) => {
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={href} className="hover:bg-surface-highest">
                        <Icon className={cn("h-5 w-5 shrink-0", !isActive && "opacity-60") } />
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
                    {fursonas.map((fursona) => (

                      <Item key={fursona.id} className="rounded-sm pl-4 cursor-pointer hover:bg-primary-foreground" variant={"outline"}>
                        <ItemMedia variant="avatar">
                          <Avatar>
                            <AvatarImage
                              src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(fursona.name)}`}
                              alt={fursona.name}
                            />
                            <AvatarFallback>{getInitials(fursona.name)}</AvatarFallback>
                          </Avatar>
                        </ItemMedia>

                        <ItemContent>
                          <ItemTitle>{fursona.name}</ItemTitle>
                          <ItemDescription>{fursona.is_default ? "Main" : (fursona.species ?? "Fursona")}</ItemDescription>
                        </ItemContent>
                      </Item>
                    ))}

                    {fursonaError ? (
                      <p className="px-4 text-sm text-red-500">{fursonaError}</p>
                    ) : null}

                    {!fursonaError && fursonas.length === 0 ? (
                      <p className="px-4 text-sm text-muted">No fursonas yet.</p>
                    ) : null}
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
          className="mt-3 h-10 w-full rounded-full"
        >
          <div>
            <span className="group-data-[collapsible=icon]/sidebar:hidden">POST</span>
            <span className="hidden group-data-[collapsible=icon]/sidebar:inline"><PlusIcon className="h-5 w-5" /></span>
          </div>
        </Button>

        <Button 
          variant="outline"
          onClick={handleSignOut} 
          className="mt-3 h-10 w-full rounded-full"
        >
          <div>
            <span className="group-data-[collapsible=icon]/sidebar:hidden">Sign out</span>
            <span className="hidden group-data-[collapsible=icon]/sidebar:inline"><LogOutIcon className="h-5 w-5" /></span>
          </div>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
