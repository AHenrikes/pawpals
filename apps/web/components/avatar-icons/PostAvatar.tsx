import { useFursonaData } from "@/hooks/useFursonaData";
import { getInitials } from "@/lib/helpers/getInitials";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { TypographyMuted, TypographyP } from "@repo/ui/typography";
import { FollowButton } from "../buttons/FollowButton";
import Link from "next/link";

export default function PostAvatar({
  userId,
  actionButton = true,
}: Readonly<{ userId: string; actionButton?: boolean }>) {
  const { user, loading } = useFursonaData(userId);

  if (!user) return;

  const avatarContent = (
    <div className="flex flex-1 justify-between items-center">
      <Link
        href={`/@${user.username}`}
        className="group flex items-center pl-1 pr-4 py-1 rounded-md gap-2"
      >
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage
            src={user.avatar_url ?? undefined}
            alt={user.display_name}
          />
          <AvatarFallback>{getInitials(user?.display_name)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <TypographyP className="group-hover:text-text/70 text-sm font-bold text-start truncate">
            {user.display_name}
          </TypographyP>

          <TypographyMuted className="group-hover:text-text text-xs truncate">
            @{user?.username}
          </TypographyMuted>
        </div>
      </Link>

      {actionButton && <FollowButton id={user.id} />}
    </div>
  );

  return (
    <>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />

          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        </div>
      ) : (
        avatarContent
      )}
    </>
  );
}
