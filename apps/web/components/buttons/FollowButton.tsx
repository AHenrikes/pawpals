import { Button } from "@repo/ui/button";

interface FollowButtonProps {
  isOwnProfile: boolean;
  isFollowing: boolean;
  loading: boolean;
  onToggle: () => Promise<void>;
}

export function FollowButton({
  isOwnProfile,
  isFollowing,
  loading,
  onToggle,
}: Readonly<FollowButtonProps>) {
  if (isOwnProfile) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={onToggle}
      disabled={loading}
      className="rounded-full px-6"
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
