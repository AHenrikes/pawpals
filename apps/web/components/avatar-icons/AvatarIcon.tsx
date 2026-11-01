"use client";

import FursonaAvatar from "./FursonaAvatar";
import { useUser } from "@/providers/UserProvider";
import Link from "next/link";

export default function AvatarIcon() {
  const { currentFursona } = useUser();

  const displayName = currentFursona?.display_name || "Account";

  return (
    <Link href={`/@${currentFursona?.username}`}>
      <FursonaAvatar
        size="sm"
        name={displayName}
        src={currentFursona?.avatar_url}
        imageWidth={64}
      />
    </Link>
  );
}
