import { useComment } from "@/hooks/social/comments/useComment";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { MessageCircleIcon } from "lucide-react";

export function CommentButton({
  id,
  count,
}: Readonly<{ id: string; count: number }>) {
  const { isCommented, toggle, loading } = useComment(id);
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
        isCommented ? "" : "hover:text-primary",
      )}
    >
      <MessageCircleIcon className={isCommented ? "fill-primary" : undefined} />
      {showCount}
    </Button>
  );
}
