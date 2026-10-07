import { useFollow } from "@/hooks/social/followers/useFollow";
import { useUser } from "@/providers/UserProvider";
import { Button } from "@repo/ui/button";

export function FollowButton({ id }: Readonly<{ id: string }>) {
  const { isFollowing, toggle, loading } = useFollow(id);
  const { currentFursona } = useUser();

  if (currentFursona?.id === id) return;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={() => {
        void toggle();
      }}
      disabled={loading}
      className="rounded-full px-6"
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
