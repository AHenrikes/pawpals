"use client";

import { useIsCurrentPath } from "@/hooks/useCurrentPath";
import { Button } from "@repo/ui/button";
import { useHomeTabs } from "@/providers/HomeTabsProvider";

const homeTabs = [
  { label: "Posts", key: "posts" },
  { label: "Reels", key: "reels" },
  { label: "Following", key: "following" },
] as const;

export default function HomeTabs() {
  const { content, navContent } = useHomeTabs();
  const isCurrentPath = useIsCurrentPath("/");
  if (!isCurrentPath) return null;

  return (
    <nav className="hidden h-full space-y-2 md:block">
      <ul className="flex items-center h-full gap-2 overflow-x-auto">
        {homeTabs.map(({ label, key }) => (
          <Button
            key={label}
            size="sm"
            variant="ghost"
            className={`justify-start py-7.75 text-muted-foreground text-base border-b border-transparent rounded-none hover:bg-transparent ${
              content === key ? "border-b border-primary" : "hover:text-text"
            }`}
            onClick={() => navContent(key)}
          >
            {label}
          </Button>
        ))}
      </ul>
    </nav>
  );
}
