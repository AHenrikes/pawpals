"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useHomeTabs } from "@/providers/HomeTabsProvider";
import PostCards from "./post/page";

export default function Dashboard() {
  const { content, direction } = useHomeTabs();

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div className="flex flex-1 py-4 md:pr-4">
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.section
          key={content}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full"
        >
          {content === "posts" && (
              <PostCards />
          )}

          {content === "reels" && (
            <div className="grid w-full place-content-center">
              Reels coming soon
            </div>
          )}

          {content === "following" && (
            <div className="grid w-full place-content-center">
              Following coming soon
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <aside className="hidden sticky top-20 flex-col w-125 h-[calc(100svh-96px)] gap-5 md:flex">
        <div className="bg-secondary animate-pulse w-full h-96 rounded-md shadow-lg" />

        <div className="bg-secondary animate-pulse w-full h-full rounded-md shadow-lg" />
      </aside>
    </div>
  );
}
