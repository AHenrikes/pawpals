import { Skeleton } from "@repo/ui/skeleton";

export default function SearchUserSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="size-14 rounded-full shrink-0" />

      <div className="space-y-2 flex-1">
        <Skeleton className="size-6 w-full md:w-4/5 rounded" />
        <Skeleton className="size-4.5 w-2/3  md:w-1/2 rounded" />
      </div>
    </div>
  );
}
