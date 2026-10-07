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
import { ProfileGallery } from "./Gallery";
import { type FursonaProfile } from "@/types/fursona";
import ProfilePostCards from "./ProfilePostCards";

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
    <SidebarProvider>
      <div className="container flex flex-col pt-2 mx-auto">
        {/* Nav */}
        <nav className="px-3 pb-4 border-b border-muted">
          <ul className="flex justify-between sm:justify-start sm:gap-2 md:gap-4">
            {profileNav.map(({ key, label, icon }) => {
              const Icon = icon;

              return (
                <Button
                  key={label}
                  variant="ghost"
                  onClick={() => handleNavClick(key)}
                  className={cn(
                    "p-4 text-text-muted rounded-sm",
                    content === key
                      ? "text-text bg-primary hover:bg-primary-dim"
                      : null,
                  )}
                >
                  {Icon && <Icon className="size-5" />}
                  <span className="hidden sm:block">{label}</span>
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
            className="grow space-y-4 min-h-[calc(100dvh-80px)] py-2 lg:overflow-y-auto scrollbar-hide md:py-4"
          >
            {content === "gallery" && <ProfileGallery username={fursona.id} />}

            {content === "post" && <ProfilePostCards fursonaId={fursona.id} />}

            {content === "archive" && <div>Archive coming soon</div>}

            {content === "likes" && <div>Likes coming soon</div>}

            {content === "about" && <div>Likes coming soon</div>}
          </motion.section>
        </AnimatePresence>
      </div>
    </SidebarProvider>
  );
}
