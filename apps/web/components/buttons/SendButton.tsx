import { useLike } from "@/hooks/social/likes/useLike";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { SendIcon } from "lucide-react";
import { ActionButtonProps } from "./ThumbsUpButton";

export function SendButton({
  id,
  size,
  className,
}: Readonly<ActionButtonProps>) {
  const { isLiked, toggle } = useLike(id);

  return (
    <Button
      size={size}
      type="submit"
      variant={"none"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
      className={cn(
        "group p-1.5 text-foreground/60 bg-primary-dim",
        isLiked ? "" : "hover:text-primary",
        className,
      )}
    >
      <SendIcon className={isLiked ? "fill-primary" : undefined} />
    </Button>
  );
}
