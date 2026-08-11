import { useFollow } from "@/hooks/social/followers/useFollow";
import { Button } from "@repo/ui/button";

export function FollowButton({ id }: Readonly<{id: string}>) {
  const { isFollowing, toggle, loading } = useFollow(id);

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={() => toggle()}
      disabled={loading}
      className="rounded-full px-6"
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
