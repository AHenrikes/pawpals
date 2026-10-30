"use client";

import { getInitials } from "@/lib/helpers/getInitials";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { avatarImageSrc } from "@/lib/uploads/avatarImageSrc";
import { useMemo } from "react";
import { useUser } from "@/providers/UserProvider";
import Link from "next/link";

export default function AvatarIcon() {
  const { currentFursona } = useUser();

  const displayName = useMemo(() => {
    if (currentFursona?.display_name) {
      return currentFursona.display_name;
    }

    return "Account";
  }, [currentFursona?.display_name]);

  return (
    <Link href={`/@${currentFursona?.username}`}>
      <Avatar size="sm">
        <AvatarImage src={avatarImageSrc(currentFursona?.avatar_url, 64)} alt={displayName} />

        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
