"use client";

import { getInitials } from "@/lib/helpers/getInitials";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Collapsible } from "@repo/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Skeleton } from "@repo/ui/skeleton";
import { TypographySmall, TypographyXSmall } from "@repo/ui/typography";
import { useMemo } from "react";
import { useUser } from "@/providers/UserProvider";
import Link from "next/link";

export default function HeaderAvatar() {
  const { currentFursona, loading, signOut } = useUser();

  const displayName = useMemo(() => {
    if (currentFursona?.display_name) {
      return currentFursona.display_name;
    }

    return "Account";
  }, [currentFursona?.display_name]);

  // const username = useMemo(() => {
  //   if (currentFursona?.username) {
  //     return currentFursona.username;
  //   }

  //   return "Username";
  // }, [currentFursona?.username]);

  return (
    // <DropdownMenu>
    //   <Collapsible>
    //     {loading ? (
    //       <Skeleton className="h-8 w-8 bg-foreground/20 rounded-full" />
    //     ) : (
    //       <DropdownMenuTrigger className="hover:cursor-pointer">
    //         <Avatar size="sm">
    //           <AvatarImage
    //             src={`${currentFursona?.avatar_url}`}
    //             alt={displayName}
    //           />

    //           <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
    //         </Avatar>
    //       </DropdownMenuTrigger>
    //     )}

    //     <DropdownMenuContent align="end" className="w-60 select-none">
    //       <DropdownMenuGroup className="flex items-center gap-1">
    //         <DropdownMenuItem className="w-full">
    //           <Link
    //             href={`/@${currentFursona?.username}`}
    //             className="flex items-center w-full gap-2"
    //           >
    //             <Avatar size="default">
    //               <AvatarImage
    //                 src={`${currentFursona?.avatar_url}`}
    //                 alt={displayName}
    //               />

    //               <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
    //             </Avatar>

    //             <div className="flex flex-col">
    //               <TypographySmall className="leading-none">
    //                 {displayName}
    //               </TypographySmall>
    //               <TypographyXSmall className="text-muted-foreground">
    //                 {username}
    //               </TypographyXSmall>
    //             </div>
    //           </Link>
    //         </DropdownMenuItem>
    //       </DropdownMenuGroup>

    //       <DropdownMenuGroup>
    //         <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
    //           Sign Out
    //         </DropdownMenuItem>
    //       </DropdownMenuGroup>
    //     </DropdownMenuContent>
    //   </Collapsible>
    // </DropdownMenu>

    <Link href={`/@${currentFursona?.username}`}>
      <Avatar size="sm">
        <AvatarImage src={`${currentFursona?.avatar_url}`} alt={displayName} />

        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
