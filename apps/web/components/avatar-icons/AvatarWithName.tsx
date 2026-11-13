"use client";

import FursonaAvatar from "./FursonaAvatar";
import { useUser } from "@/providers/UserProvider";
import Link from "next/link";
import { TypographyLead, TypographyP } from "@repo/ui/typography";

export default function AvatarWithName({
  size,
  showUserName,
}: Readonly<{ size?: "lg" | "sm", showUserName?: boolean }>) {
  const { currentFursona } = useUser();

  const displayName = currentFursona?.display_name || "Account";

  return (
    <Link
      href={`/@${currentFursona?.username}`}
      className="flex items-center gap-4 px-2 py-2 rounded-md transition-colors duration-300 hover:bg-accent"
    >
      <FursonaAvatar
        size={size}
        name={displayName}
        src={currentFursona?.avatar_url}
      />

      <span>
        <TypographyLead>{currentFursona?.display_name}</TypographyLead>

        {showUserName && (
          <TypographyP className="text-xs">
            {currentFursona?.username}
          </TypographyP>
        )}
      </span>
    </Link>
  );
}
