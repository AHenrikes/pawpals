"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";
import { SidebarProvider } from "@/providers/SidebarProvider";
import {
  BookmarkIcon,
  GalleryVerticalIcon,
  HeartIcon,
  LayoutGridIcon,
  Repeat2Icon,
} from "lucide-react";
import { type FursonaProfile } from "@/types/fursona";

const profileNav = [
  { label: "GALLERY", key: "gallery", icon: LayoutGridIcon },
  { label: "POST", key: "post", icon: GalleryVerticalIcon },
  { label: "REPOST", key: "repost", icon: Repeat2Icon },
  { label: "BOOKMARK", key: "bookmark", icon: BookmarkIcon },
  { label: "LIKE", key: "like", icon: HeartIcon },
];

type ContentKey = (typeof profileNav)[number]["key"];

export default function ProfileContent({
  fursona,
}: Readonly<{ fursona: FursonaProfile }>) {
  const [content, setContent] = useState<ContentKey>("gallery");
  const [direction, setDirection] = useState(0);

  const handleNavClick = (key: ContentKey) => {
    const oldIndex = profileNav.findIndex((n) => n.key === content);
    const newIndex = profileNav.findIndex((n) => n.key === key);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setContent(key);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <SidebarProvider className="flex min-w-0 flex-col pt-2">
      {/* Nav */}
      <nav className="overflow-x-auto border-b border-muted pb-3 scrollbar-hide">
        <ul className="flex min-w-max justify-between sm:gap-12 md:justify-start md:gap-3">
          {profileNav.map(({ key, label, icon }) => {
            const Icon = icon;

            return (
              <Button
                key={label}
                variant="ghost"
                onClick={() => handleNavClick(key)}
                className={cn(
                  "h-10 rounded-sm px-3 text-text-muted sm:px-4",
                  content === key
                    ? "text-text bg-primary hover:bg-primary-dim"
                    : null,
                )}
              >
                {Icon && <Icon className="size-5" />}
                <span className="hidden text-xs md:block sm:text-sm">
                  {label}
                </span>
              </Button>
            );
          })}
        </ul>
      </nav>

      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.section
          key={content}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="min-h-48 grow space-y-4 py-4 sm:min-h-64"
        >
          {content === "gallery" && <div>Gallery coming soon</div>}

          {content === "post" && <div>Post coming soon</div>}

          {content === "repost" && <div>Repost coming soon</div>}

          {content === "bookmark" && <div>Bookmarks coming soon</div>}

          {content === "like" && <div>Likes coming soon</div>}
        </motion.section>
      </AnimatePresence>
    </SidebarProvider>
  );
}
