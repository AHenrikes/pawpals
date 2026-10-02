import { useBookmark } from "@/hooks/social/bookmarks/useBookmark";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { BookmarkIcon } from "lucide-react";

export function BookmarkButton({ id }: Readonly<{ id: string }>) {
  const { isBookmarked, toggle, loading } = useBookmark(id);

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
        isBookmarked ? "" : "hover:text-primary",
      )}
    >
      <BookmarkIcon className={isBookmarked ? "fill-primary" : undefined} />
    </Button>
  );
}
