import { useLike } from "@/hooks/social/likes/useLike";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { HeartIcon } from "lucide-react";

export function LikeButton({
  id,
  count,
}: Readonly<{ id: string; count: number }>) {
  const { isLiked, toggle, loading } = useLike(id);
  const showCount = count > 0 ? count : undefined;

  return (
    <Button
      size={"icon"}
      variant={"none"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
      disabled={loading}
      className={cn(
        "group p-2 px-3 gap-1.5 text-xs text-foreground/60",
        isLiked ? "" : "hover:text-primary",
      )}
    >
      <HeartIcon className={isLiked ? "fill-primary" : undefined} />
      {showCount}
    </Button>
  );
}
