import { useLike } from "@/hooks/social/likes/useLike";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { ThumbsUpIcon } from "lucide-react";

export interface ActionButtonProps {
  id: string;
  size?: "icon" | "icon-lg" | "icon-sm" | "icon-xs";
  count?: number;
  className?: string;
}

export function ThumbsUpButton({
  id,
  size,
  count,
}: Readonly<ActionButtonProps>) {
  const { isLiked, toggle, loading } = useLike(id);

  return (
    <Button
      size={size}
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
      <ThumbsUpIcon className={isLiked ? "fill-primary" : undefined} />
      {count}
    </Button>
  );
}
