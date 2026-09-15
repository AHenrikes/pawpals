"use client";

import { getInitials } from "@/lib/helpers/getInitials";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Collapsible } from "@repo/ui/collapsible";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Skeleton } from "@repo/ui/skeleton";
import { TypographySmall, TypographyXSmall } from "@repo/ui/typography";
import {
  SettingsIcon,
  ShoppingCartIcon,
  WalletMinimalIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useUser } from "@/providers/UserProvider";
import { AUTH_ROUTES } from "@/lib/constants/auth";
import Link from "next/link";

export default function HeaderAvatar() {
  const { currentFursona, loading, signOut } = useUser();

  const displayName = useMemo(() => {
    if (currentFursona?.display_name) {
      return currentFursona.display_name;
    }

    return "Account";
  }, [currentFursona?.display_name]);

  const username = useMemo(() => {
    if (currentFursona?.username) {
      return currentFursona.username;
    }

    return "Username";
  }, [currentFursona?.username]);

  const accountMenuGroup = [
    { href: AUTH_ROUTES.SETTINGS, label: "Wallet", icon: WalletMinimalIcon },
    { href: AUTH_ROUTES.SETTINGS, label: "Orders", icon: ShoppingCartIcon },
    { href: AUTH_ROUTES.SETTINGS, label: "Settings", icon: SettingsIcon },
  ];

  return (
    <Collapsible>
      {loading ? (
        <Skeleton className="h-8 w-8 bg-foreground/20 rounded-full" />
      ) : (
        <DropdownMenuTrigger className="hover:cursor-pointer">
          <Avatar size="sm">
            <AvatarImage
              src={`${currentFursona?.avatar_url}`}
              alt={displayName}
            />

            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent align="end" className="w-60 select-none">
        <DropdownMenuGroup className="flex items-center gap-1">
          <DropdownMenuItem className="w-full">
            <Link
              href={`/@${currentFursona?.username}`}
              className="flex items-center w-full gap-2"
            >
              <Avatar size="default">
                <AvatarImage
                  src={`${currentFursona?.avatar_url}`}
                  alt={displayName}
                />

                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <TypographySmall className="leading-none">
                  {displayName}
                </TypographySmall>
                <TypographyXSmall className="text-muted-foreground">
                  {username}
                </TypographyXSmall>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup className="pb-1">
          <DropdownMenuLabel>Fursona</DropdownMenuLabel>

          {accountMenuGroup.map((li) => {
            const Icon = li.icon;

            return (
              <DropdownMenuItem key={li.label}>
                <Link href={li.href} className="flex items-center w-full gap-2">
                  <Icon className="h-4 w-4" />
                  {li.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </Collapsible>
  );
}
