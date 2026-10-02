"use client";

import { useEffect } from "react";

export function LockScreen(state: boolean) {
  useEffect(() => {
    document.body.style.overflow = state ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [state]);
}

export function KeyboardEvent(state: boolean, action: () => void) {
  useEffect(() => {
    if (!state) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state, action]);
}
