"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

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

  const navContent = useCallback(
    (key: ContentKey) => {
      const oldIndex = homeTabs.findIndex((n) => n.key === content);
      const newIndex = homeTabs.findIndex((n) => n.key === key);
      setDirection(newIndex > oldIndex ? 1 : -1);
      setContent(key);
    },
    [content],
  );

  const value = useMemo(
    () => ({ content, direction, navContent }),
    [content, direction, navContent],
  );

  return (
    <HomeTabsContext.Provider value={value}>
      {children}
    </HomeTabsContext.Provider>
  );
}

export function useHomeTabs() {
  const ctx = useContext(HomeTabsContext);
  if (!ctx) throw new Error("useHomeTabs must be used within HomeTabsProvider");
  return ctx;
}
