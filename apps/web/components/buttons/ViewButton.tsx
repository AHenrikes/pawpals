import { useView } from "@/hooks/social/views/useView";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { EyeIcon } from "lucide-react";

export function ViewButton({
  id,
  count,
}: Readonly<{ id: string; count: number }>) {
  const { isViewed, loading } = useView(id);
  const showCount = count > 0 ? count : undefined;

  return (
    <Button
      size={"icon"}
      variant={"none"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      disabled={loading}
      className={cn(
        "group p-2 px-3 gap-1.5 text-xs text-foreground/60 cursor-default",
        isViewed ? "" : "hover:text-primary",
      )}
    >
      <EyeIcon className={isViewed ? "fill-primary" : undefined} />
      {showCount}
    </Button>
  );
}
