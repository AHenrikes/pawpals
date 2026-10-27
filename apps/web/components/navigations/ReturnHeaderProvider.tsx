"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ReturnHeaderOverride = {
  // title: string;
  onBack: () => void;
};

type ReturnHeaderContextValue = {
  override: ReturnHeaderOverride | null;
  setOverride: (override: ReturnHeaderOverride | null) => void;
};

const ReturnHeaderContext = createContext<ReturnHeaderContextValue | null>(
  null,
);

export function ReturnHeaderProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [override, setOverrideState] = useState<ReturnHeaderOverride | null>(
    null,
  );
  const setOverride = useCallback(
    (value: ReturnHeaderOverride | null) => setOverrideState(value),
    [],
  );

  return (
    <ReturnHeaderContext.Provider value={{ override, setOverride }}>
      {children}
    </ReturnHeaderContext.Provider>
  );
}

export function useReturnHeader() {
  const context = useContext(ReturnHeaderContext);
  if (!context) {
    throw new Error("useReturnHeader must be used within ReturnHeaderProvider");
  }
  return context;
}
