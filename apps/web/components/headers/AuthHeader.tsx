"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Button } from "@repo/ui/button";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@repo/ui/collapsible";
import { SidebarTrigger } from "@/providers/SidebarProvider";
import { Settings, User, ArrowDownUp } from "lucide-react";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AuthHeader() {
  const { fursonas, currentFursona, user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFursonaListOpen, setIsFursonaListOpen] = useState(false);

  const displayName = useMemo(() => {
    if (currentFursona?.name) {
      return currentFursona.name;
    }

    return "Account";
  }, [currentFursona?.name]);

  const avatarSeed = currentFursona?.name ?? user?.email ?? "account";
  const profileSubtitle = currentFursona?.username ?? user?.email ?? "No username";

  function handleMenuOpenChange(nextOpen: boolean) {
    setIsMenuOpen(nextOpen);

    if (!nextOpen) {
      setIsFursonaListOpen(false);
    }
  }

  const accountMenuGroup = [
    { href: AUTH_ROUTES.PROFILE, label: "Profile", icon: User },
    { href: AUTH_ROUTES.SETTINGS, label: "Settings", icon: Settings },
  ];

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
          <DropdownMenu open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
            <Collapsible
              open={isFursonaListOpen}
              onOpenChange={setIsFursonaListOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant={"none"} className="p-0 focus-visible:ring-0">
                  <Avatar size="sm">
                    <AvatarImage src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(avatarSeed)}`} alt={displayName} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 select-none">
                <DropdownMenuGroup className="flex items-center gap-1">
                  <DropdownMenuItem asChild className="w-full pr-4 rounded-none">
                    <Link href={AUTH_ROUTES.PROFILE}>
                      <Avatar size="sm">
                        <AvatarImage src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(avatarSeed)}`} alt={displayName} />
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                      </Avatar>

                      <span>
                        <p className="text-sm">{displayName}</p>
                        <p className="text-xs">{profileSubtitle}</p>
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <CollapsibleTrigger asChild>
                    <Button
                      size={"icon"}
                      variant={"none"}
                      className="rounded-none hover:bg-surface-highest px-4 py-6"
                    >
                      <ArrowDownUp className="h-5 w-5" />
                      <span className="sr-only">Switch Fursona</span>
                    </Button>
                  </CollapsibleTrigger>
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

                <CollapsibleContent>
                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Fursonas</DropdownMenuLabel>

                    {fursonas.map((elem) => (
                      <DropdownMenuItem key={elem.id}>
                        <p>{elem.username}</p>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </CollapsibleContent>
              </DropdownMenuContent>
            </Collapsible>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
