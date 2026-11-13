"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAppPreferences } from "./AppPreferencesProvider";
import { useUser } from "./UserProvider";

export default function ThemeSyncController() {
  const { currentFursona } = useUser();
  const { appThemeSource, setAppThemeSource } = useAppPreferences();
  const { theme, setTheme } = useTheme();
  const profileTheme = currentFursona?.profile_theme;

  useEffect(() => {
    if (appThemeSource === "profile" && profileTheme === "app") {
      setAppThemeSource("independent");
      return;
    }
    if (
      appThemeSource === "profile" &&
      (profileTheme === "light" || profileTheme === "dark") &&
      theme !== profileTheme
    ) {
      setTheme(profileTheme);
    }
  }, [appThemeSource, profileTheme, theme, setTheme, setAppThemeSource]);

  return null;
}
