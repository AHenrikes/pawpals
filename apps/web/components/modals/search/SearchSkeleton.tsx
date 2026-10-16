import SearchUserSkeleton from "@/components/Skeletons/SearchUserSkeleton";
import { Button } from "@repo/ui/button";
import { Separator } from "@repo/ui/separator";
import { Skeleton } from "@repo/ui/skeleton";
import {
  TypographyH4,
  TypographyMuted,
  TypographyXSmall,
} from "@repo/ui/typography";
import { type Variants } from "framer-motion";

export const parentVariants: Variants = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.05, staggerChildren: 0.25 },
  },
};

export const groupVariants: Variants = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.05, staggerChildren: 0.25 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

export default function SearchSkeleton() {
  return (
    <div className="flex flex-col h-full gap-6 md:flex-row md:max-h-64">
      {/* History Section */}
      <section className="space-y-4 w-full md:max-w-72">
        <div className="flex justify-between items-center">
          <TypographyH4 className="text-base text-text-muted md:text-base">
            History
          </TypographyH4>

          <Button
            size={"xs"}
            variant={"none"}
            className="h-fit p-0 text-text-muted hover:text-text"
          >
            <TypographyXSmall>Clear</TypographyXSmall>
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 overflow-y-auto scrollbar-none">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton
              key={`elem-${i}`}
              className="h-12 w-full bg-muted rounded-xs md:w-72"
            />
          ))}
        </div>
      </section>

      <Separator orientation="horizontal" className="hidden w-px md:block" />

      {/* Users Section */}
      <section className="space-y-6 md:flex-1">
        <div className="flex justify-between items-center">
          <TypographyMuted className="text-xs md:text-sm">
            Users
          </TypographyMuted>

          <Button
            size={"xs"}
            variant={"none"}
            className="h-fit p-0 text-text-muted hover:text-text"
          >
            <TypographyXSmall>View all</TypographyXSmall>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SearchUserSkeleton key={`user-col1-${i}`} />
            ))}
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SearchUserSkeleton key={`user-col2-${i}`} />
            ))}
          </div>
        </div>
      </section>

      <Separator orientation="horizontal" className="hidden w-px lg:block" />

      {/* Tags Section */}
      <section className="space-y-6 w-full md:max-w-72">
        <TypographyMuted className="text-xs md:text-sm">#Tags</TypographyMuted>

        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={`tag-${i}`}
              className="h-8 w-full rounded-xs md:w-72"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
