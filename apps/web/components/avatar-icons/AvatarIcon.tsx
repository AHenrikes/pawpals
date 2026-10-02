import { useFursonaData } from "@/hooks/useFursonaData";
import { getInitials } from "@/lib/helpers/getInitials";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import Link from "next/link";

export default function AvatarIcon({ id }: Readonly<{ id: string }>) {
  const { user, loading } = useFursonaData(id);
  if (!user) return;

  const avatarIcon = (
    <Link href={`@${user.display_name}`}>
      <Avatar>
        <AvatarImage
          src={user.avatar_url ?? undefined}
          alt={user.display_name}
        />
        <AvatarFallback>{getInitials(user?.display_name)}</AvatarFallback>
      </Avatar>
    </Link>
  );

  return (
    <>
      {loading ? (
        <div className="h-12 w-12 bg-muted rounded-full animate-pulse" />
      ) : (
        avatarIcon
      )}
    </>
  );
}
