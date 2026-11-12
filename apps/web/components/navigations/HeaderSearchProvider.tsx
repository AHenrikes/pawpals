"use client";

import { createContext, useContext, useState } from "react";

type HeaderSearchContextValue = {
  query: string;
  setQuery: (query: string) => void;
};

const HeaderSearchContext = createContext<HeaderSearchContextValue | null>(
  null,
);

export function HeaderSearchProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [query, setQuery] = useState("");

  return (
    <HeaderSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </HeaderSearchContext.Provider>
  );
}

export function useHeaderSearch() {
  const context = useContext(HeaderSearchContext);
  if (!context) {
    throw new Error("useHeaderSearch must be used within HeaderSearchProvider");
  }
  return context;
}
