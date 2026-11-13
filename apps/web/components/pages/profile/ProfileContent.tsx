"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@repo/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@repo/ui/lib/utils";
import { SidebarProvider } from "@/providers/SidebarProvider";
import {
  BookmarkIcon,
  GalleryVerticalIcon,
  HeartIcon,
  ImageIcon,
  Repeat2Icon,
} from "lucide-react";
import { useAppPreferences } from "@/providers/AppPreferencesProvider";

const profileNav = [
  { label: "GALLERY", key: "gallery", icon: ImageIcon },
  { label: "POST", key: "post", icon: GalleryVerticalIcon },
  { label: "REPOST", key: "repost", icon: Repeat2Icon },
  { label: "BOOKMARK", key: "bookmark", icon: BookmarkIcon },
  { label: "LIKE", key: "like", icon: HeartIcon },
];

type ContentKey = (typeof profileNav)[number]["key"];

export default function ProfileContent() {
  const [content, setContent] = useState<ContentKey>("gallery");
  const [direction, setDirection] = useState(0);
  const tabId = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const prefersReducedMotion = useReducedMotion();
  const { motion: motionPreference } = useAppPreferences();
  const reduceMotion = motionPreference === "reduced" || prefersReducedMotion;

  const handleNavClick = (key: ContentKey) => {
    const oldIndex = profileNav.findIndex((n) => n.key === content);
    const newIndex = profileNav.findIndex((n) => n.key === key);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setContent(key);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % profileNav.length;
        break;
      case "ArrowLeft":
        nextIndex = (index - 1 + profileNav.length) % profileNav.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = profileNav.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextTab = profileNav[nextIndex];
    if (nextTab) handleNavClick(nextTab.key);
    tabs.current[nextIndex]?.focus();
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <SidebarProvider className="flex min-w-0 flex-col pt-2">
      {/* Nav */}
      <div className="overflow-x-auto border-b border-muted pb-3 scrollbar-hide">
        <div
          role="tablist"
          aria-label="Profile content"
          className="flex min-w-max gap-2 sm:gap-4"
        >
          {profileNav.map(({ key, label, icon }, index) => {
            const Icon = icon;

            return (
              <Button
                key={label}
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                id={`${tabId}-${key}`}
                role="tab"
                variant="ghost"
                onClick={() => handleNavClick(key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                aria-selected={content === key}
                tabIndex={content === key ? 0 : -1}
                className={cn(
                  "relative min-h-11 shrink-0 rounded-sm px-3 text-sm text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4",
                  content === key
                    ? "text-text after:absolute after:inset-x-2 after:bottom-0 after:border-b-2 after:border-current"
                    : null,
                )}
              >
                {Icon && <Icon className="size-5" aria-hidden="true" />}
                <span className="text-sm">{label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.section
          key={content}
          id={`${tabId}-panel-${content}`}
          role="tabpanel"
          aria-labelledby={`${tabId}-${content}`}
          tabIndex={0}
          custom={direction}
          variants={slideVariants}
          initial={reduceMotion ? false : "enter"}
          animate="center"
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeInOut" }}
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
