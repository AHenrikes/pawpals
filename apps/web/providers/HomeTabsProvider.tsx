"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const homeTabs = [
  { label: "Posts", key: "posts" },
  { label: "Reels", key: "reels" },
  { label: "Following", key: "following" },
] as const;

type ContentKey = (typeof homeTabs)[number]["key"];

type HomeTabsContextType = {
  content: ContentKey;
  direction: number;
  navContent: (key: ContentKey) => void;
};

const HomeTabsContext = createContext<HomeTabsContextType | null>(null);

export function HomeTabsProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [content, setContent] = useState<ContentKey>("posts");
  const [direction, setDirection] = useState(0);

  const navContent = (key: ContentKey) => {
    const oldIndex = homeTabs.findIndex((n) => n.key === content);
    const newIndex = homeTabs.findIndex((n) => n.key === key);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setContent(key);
  };

  return (
    <HomeTabsContext.Provider value={{ content, direction, navContent }}>
      {children}
    </HomeTabsContext.Provider>
  );
}

export function useHomeTabs() {
  const ctx = useContext(HomeTabsContext);
  if (!ctx) throw new Error("useHomeTabs must be used within HomeTabsProvider");
  return ctx;
}
