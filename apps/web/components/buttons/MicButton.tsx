import { useLike } from "@/hooks/social/likes/useLike";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { MicIcon } from "lucide-react";
import { ActionButtonProps } from "./ThumbsUpButton";

export function MicButton({ id, size }: Readonly<ActionButtonProps>) {
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
        "group text-foreground/60 bg-primary-dim",
        isLiked ? "" : "hover:text-primary",
      )}
    >
      <MicIcon className={isLiked ? "fill-primary" : undefined} />
    </Button>
  );
}
