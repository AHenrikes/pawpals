import { useLike } from "@/hooks/social/likes/useLike";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { ScanFaceIcon } from "lucide-react";
import { ActionButtonProps } from "./ThumbsUpButton";

export function StickerButton({
  id,
  size,
  className,
}: Readonly<ActionButtonProps>) {
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
        "group p-1.5 text-foreground/60",
        isLiked ? "" : "hover:text-primary",
        className,
      )}
    >
      <ScanFaceIcon className={isLiked ? "fill-primary" : undefined} />
    </Button>
  );
}
