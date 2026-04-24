"use client";

import { useMemo } from "react";
import { Button } from "@repo/ui/button";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { SidebarTrigger } from "@/providers/SidebarProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import Link from "next/link";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { Settings, User, Users } from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AuthHeader() {
  const { currentFursona, user } = useUser();

  const displayName = useMemo(() => {
    if (currentFursona?.name) {
      return currentFursona.name;
    }

    return "Account";
  }, [currentFursona?.name]);

  const avatarSeed = currentFursona?.name ?? user?.email ?? "account";

  const accountMenuGroup = [
    { href: AUTH_ROUTES.PROFILE, label: "Profile", icon: User },
    { href: AUTH_ROUTES.SETTINGS, label: "Settings", icon: Settings },
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-popover bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-full w-full items-center justify-between px-6">
        <div className="flex gap-1 items-center">
          <SidebarTrigger className="border-none" />
          <Link href={AUTH_ROUTES.HOME}>
            <h1>PAWPALS</h1>
          </Link>
        </div>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={"none"} className="p-0 focus-visible:ring-0">
                <Avatar size="sm">
                  <AvatarImage src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(avatarSeed)}`} alt={displayName} />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 select-none">
              <DropdownMenuGroup className="flex gap-2">
                <DropdownMenuItem asChild className="pr-4 rounded-none">
                  <Link href={AUTH_ROUTES.PROFILE}>
                    <Avatar size="sm">
                      <AvatarImage src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(avatarSeed)}`} alt={displayName} />
                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                    </Avatar>

                    <span>
                      <p className="text-sm">{currentFursona?.name}</p>
                      <p className="text-xs">{currentFursona?.username}</p>
                    </span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="w-full justify-center rounded-none">
                  <Users />
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                {accountMenuGroup.map((li) => {
                  const Icon = li.icon;
                  return (
                    <DropdownMenuItem key={li.label} asChild>
                      <Link href={li.href}>
                        <Icon className="h-4 w-4" />
                        {li.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
