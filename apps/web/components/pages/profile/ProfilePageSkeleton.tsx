import { Skeleton } from "@repo/ui/skeleton";
import { motion } from "framer-motion";

export default function ProfilePageSkeleton() {
  return (
    <div className="flex-1 w-full">
      <motion.section
        key="banner-skeleton"
        exit={{ opacity: 0 }}
        className="relative h-56 w-full sm:h-72 md:h-96 xl:h-112"
      >
        <Skeleton className="h-full" />
      </motion.section>

      <section className="container py-4">
        <div className="relative -mt-18 flex-1 space-y-4 md:-mt-24">
          <motion.div
            key="avatar-skeleton"
            exit={{ opacity: 0 }}
            className="flex w-full min-w-0 items-end gap-3 sm:gap-4"
          >
            <Skeleton className="h-24 w-24 shrink-0 animate-none rounded-full border-4 border-background shadow-lg sm:h-32 sm:w-32 md:h-40 md:w-40" />

            <div className="min-w-0 flex-1 space-y-1 pb-2 sm:pb-4">
              <div className="min-w-0 space-y-0.5">
                <Skeleton className="h-9 w-52 rounded-xs" />

                <span className="flex min-w-0 items-center gap-0.5">
                  <Skeleton className="h-6 w-30 min-w-0 truncate rounded-xs" />
                  <Skeleton className="h-6 w-15 shrink-0 rounded-xs" />
                </span>
              </div>
            </div>
          </motion.div>

          <section>
            <motion.div
              key="count-skeleton"
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex min-w-16 flex-col items-center gap-1 sm:w-20 sm:flex-row sm:gap-2"
                  >
                    <Skeleton className="h-16 w-full rounded-sm sm:h-10" />
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="flex gap-4">
            <motion.div
              key="others-skeleton"
              exit={{ opacity: 0 }}
              className="w-full space-y-6"
            >
              <Skeleton className="h-24 w-full rounded-sm" />
            </motion.div>

            <aside className="hidden w-72 shrink-0 flex-col gap-5 space-y-6 lg:block xl:w-80">
              <Skeleton className="h-16 w-full rounded-sm" />
              <Skeleton className="h-full w-full rounded-sm" />
            </aside>
          </section>
        </div>
      </section>
    </div>
  );
}
