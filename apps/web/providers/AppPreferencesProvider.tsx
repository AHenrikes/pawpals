"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";

type MotionPreference = "system" | "reduced";
type TextSize = "default" | "large";

type AppPreferences = {
  motion: MotionPreference;
  setMotion: (value: MotionPreference) => void;
  textSize: TextSize;
  setTextSize: (value: TextSize) => void;
  followRequestAlerts: boolean;
  setFollowRequestAlerts: (value: boolean) => void;
};

const STORAGE_KEY = "pawpals-app-preferences";
const AppPreferencesContext = createContext<AppPreferences | null>(null);

export function AppPreferencesProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [motion, setMotion] = useState<MotionPreference>("system");
  const [textSize, setTextSize] = useState<TextSize>("default");
  const [followRequestAlerts, setFollowRequestAlerts] = useState(true);
  const [systemReduced, setSystemReduced] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (stored?.motion === "system" || stored?.motion === "reduced")
        setMotion(stored.motion);
      if (stored?.textSize === "default" || stored?.textSize === "large")
        setTextSize(stored.textSize);
      if (typeof stored?.followRequestAlerts === "boolean")
        setFollowRequestAlerts(stored.followRequestAlerts);
    } catch {
      // Private browsing or malformed stored data should not block the app.
    }
    setLoaded(true);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setSystemReduced(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    return () => media.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.dataset.motion = motion;
    document.documentElement.dataset.textSize = textSize;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ motion, textSize, followRequestAlerts }),
      );
    } catch {
      // Preferences still apply for this visit if storage is unavailable.
    }
  }, [loaded, motion, textSize, followRequestAlerts]);

  const value = useMemo(
    () => ({
      motion,
      setMotion,
      textSize,
      setTextSize,
      followRequestAlerts,
      setFollowRequestAlerts,
    }),
    [motion, textSize, followRequestAlerts],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      <MotionConfig
        reducedMotion={
          motion === "reduced" || systemReduced ? "always" : "never"
        }
      >
        {children}
      </MotionConfig>
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context)
    throw new Error(
      "useAppPreferences must be used within AppPreferencesProvider",
    );
  return context;
}
