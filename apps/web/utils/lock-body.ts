"use client";

import { useEffect } from "react";

// Lock body scroll when open
export function LockScreen(state: boolean) {
  useEffect(() => {
    document.body.style.overflow = state ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [state]);
}

// Close on escape
export function KeyboardEvent(state: boolean, action: () => void) {
  useEffect(() => {
    if (!state) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        action();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state, action]);
}
