import { useLike } from "@/hooks/social/likes/useLike";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { PaperclipIcon } from "lucide-react";
import { ActionButtonProps } from "./ThumbsUpButton";

export function FileButton({ id, size }: Readonly<ActionButtonProps>) {
  const { isLiked, toggle } = useLike(id);

  return (
    <Button
      size={size}
      variant={"none"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
      className={cn(
        "group p-1 text-foreground/60",
        isLiked ? "" : "hover:text-primary",
      )}
    >
      <PaperclipIcon className={isLiked ? "fill-primary" : undefined} />
    </Button>
  );
}
