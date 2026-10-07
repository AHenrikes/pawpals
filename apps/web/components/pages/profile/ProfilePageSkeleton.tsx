import { Skeleton } from "@repo/ui/skeleton";
import { motion } from "framer-motion";

export default function ProfilePageSkeleton() {
  return (
    <div className="flex-1 w-full">
      <motion.section
        key="banner-skeleton"
        exit={{ opacity: 0 }}
        className="relative w-full h-64 md:h-[55dvh]"
      >
        <Skeleton className="h-full" />
      </motion.section>

      <section className="px-2 py-4 sm:container sm:mx-auto md:px-4">
        <div className="relative flex-1 -mt-15.5 space-y-4 sm:-mt-20 md:-mt-24">
          <motion.div
            key="avatar-skeleton"
            exit={{ opacity: 0 }}
            className="flex w-full min-w-0 items-end gap-2"
          >
            <Skeleton className="animate-none h-28 w-28 rounded-full border-4 border-background shadow-lg shrink-0 md:h-44 md:w-44" />

            <div className="flex-1 min-w-0 space-y-1 px-2 md:mb-5">
              <div className="min-w-0 space-y-0.5">
                <Skeleton className="h-9 w-52 rounded-xs" />

                <span className="flex min-w-0 items-center gap-0.5">
                  <Skeleton className="h-6 w-30 min-w-0 truncate rounded-xs" />
                  <Skeleton className="h-6 w-15 shrink-0 rounded-xs" />
                </span>
              </div>
            </div>
          </motion.div>

          <section className="flex gap-4">
            <motion.div
              key="info-skeleton"
              exit={{ opacity: 0 }}
              className="w-full space-y-6"
            >
              <div className="flex items-center gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center w-20 gap-2">
                    <Skeleton className="h-7 w-10 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-xs" />
                  </div>
                ))}
              </div>

              <Skeleton className="h-16 w-full rounded-sm" />
            </motion.div>

            <aside className="hidden flex-col w-125 max-w-[320px] space-y-6 gap-5 lg:block xl:max-w-full">
              <Skeleton className="h-16 w-full rounded-sm" />
              <Skeleton className="h-full w-full rounded-sm" />
            </aside>
          </section>
        </div>
      </section>
    </div>
  );
}
