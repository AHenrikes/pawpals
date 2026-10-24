"use client";

import { getInitials } from "@/lib/helpers/getInitials";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { useMemo } from "react";
import { useUser } from "@/providers/UserProvider";
import Link from "next/link";
import { TypographyLead, TypographyP } from "@repo/ui/typography";

export default function AvatarWithName({ size }: Readonly<{ size?: "lg" | "sm" }>) {
  const { currentFursona } = useUser();

  const displayName = useMemo(() => {
    if (currentFursona?.display_name) {
      return currentFursona.display_name;
    }

    return "Account";
  }, [currentFursona?.display_name]);

  return (
    <Link
      href={`/@${currentFursona?.username}`}
      className="flex items-center gap-4 px-2 py-2 rounded-md transition-colors duration-300 hover:bg-accent"
    >
      <Avatar size={size}>
        <AvatarImage src={`${currentFursona?.avatar_url}`} alt={displayName} />

        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>

      <span>
        <TypographyLead>{currentFursona?.display_name}</TypographyLead>
        <TypographyP className="text-xs">{currentFursona?.username}</TypographyP>
      </span>
    </Link>
  );
}
