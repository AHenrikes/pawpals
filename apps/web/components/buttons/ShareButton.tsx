import { useShare } from "@/hooks/social/shares/useShare";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { Share2Icon } from "lucide-react";

export function ShareButton({
  id,
  count,
}: Readonly<{ id: string; count: number }>) {
  const { isShared, toggle, loading } = useShare(id);
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
        isShared ? "" : "hover:text-primary",
      )}
    >
      <Share2Icon className={isShared ? "fill-primary" : undefined} />
      {showCount}
    </Button>
  );
}
