"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";
import { useAppPreferences } from "@/providers/AppPreferencesProvider";
import { useUser } from "@/providers/UserProvider";

type Option<T extends string> = {
  value: T;
  label: string;
  description: string;
  disabled?: boolean;
};

function PreferenceGroup<T extends string>({
  title,
  anchor,
  description,
  value,
  options,
  onChange,
  disabled = false,
}: Readonly<{
  title: string;
  anchor: string;
  description: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}>) {
  const id = useId();

  return (
    <fieldset
      id={anchor}
      tabIndex={-1}
      className="space-y-4 scroll-mt-6 focus:outline-none"
      aria-describedby={id}
    >
      <legend className="text-lg font-semibold text-text">{title}</legend>
      <p id={id} className="text-sm text-text-muted">
        {description}
      </p>
      <div className="glass-panel grid gap-3 rounded-2xl p-4 sm:grid-cols-2 sm:p-5">
        {options.map((option) => (
          <label
            key={option.value}
            className="glass-control flex min-h-24 cursor-pointer gap-3 rounded-xl border p-4 text-left transition-colors has-checked:border-primary has-checked:bg-primary/15 has-disabled:cursor-not-allowed has-disabled:opacity-60 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
          >
            <input
              type="radio"
              aria-label={option.label}
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled || option.disabled}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>
              <span className="block text-sm font-semibold text-text">
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-text-muted">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const themeOptions = [
  {
    value: "system",
    label: "System",
    description: "Match your device's appearance.",
  },
  { value: "light", label: "Light", description: "Use the light appearance." },
  { value: "dark", label: "Dark", description: "Use the dark appearance." },
] as const;

const followProfileOption = {
  value: "profile",
  label: "Follow active profile",
  description: "Use this fursona's saved light or dark theme on this device.",
} as const;

const motionOptions = [
  {
    value: "system",
    label: "System",
    description: "Follow your device's motion preference.",
  },
  {
    value: "reduced",
    label: "Reduced",
    description: "Minimize animations and page transitions.",
  },
] as const;

const textSizeOptions = [
  {
    value: "default",
    label: "Default",
    description: "Use the standard app text size.",
  },
  {
    value: "large",
    label: "Larger",
    description: "Increase text that follows the app's scale.",
  },
] as const;

const notificationOptions = [
  {
    value: "on",
    label: "On",
    description: "Show a badge for pending follow requests.",
  },
  {
    value: "off",
    label: "Off",
    description: "Check follow requests when you open the bell.",
  },
] as const;

export default function SettingsApp({
  section,
}: Readonly<{ section: "appearance" | "notifications" }>) {
  const { theme, setTheme } = useTheme();
  const { currentFursona } = useUser();
  const {
    motion,
    setMotion,
    textSize,
    setTextSize,
    followRequestAlerts,
    setFollowRequestAlerts,
    appThemeSource,
    setAppThemeSource,
  } = useAppPreferences();
  const [mounted, setMounted] = useState(false);
  let selectedTheme: "system" | "light" | "dark" | "profile" = "system";
  if (mounted) {
    if (appThemeSource === "profile") selectedTheme = "profile";
    else if (theme === "light" || theme === "dark" || theme === "system")
      selectedTheme = theme;
  }

  useEffect(() => setMounted(true), []);

  return (
    <div className="w-full space-y-8">
      {section === "appearance" && (
        <>
          <PreferenceGroup
            title="Theme"
            anchor="app-theme"
            description="Choose a device theme, or follow your active fursona's saved theme."
            value={selectedTheme}
            options={[
              ...themeOptions,
              {
                ...followProfileOption,
                disabled:
                  !currentFursona || currentFursona.profile_theme === "app",
              },
            ]}
            onChange={(value) => {
              if (value === "profile") {
                setAppThemeSource("profile");
              } else {
                setAppThemeSource("independent");
                setTheme(value);
              }
            }}
            disabled={!mounted}
          />

          <PreferenceGroup
            title="Animations"
            anchor="animations"
            description="Control movement throughout the app, including page transitions."
            value={motion}
            options={motionOptions}
            onChange={setMotion}
          />

          <PreferenceGroup
            title="Text size"
            anchor="text-size"
            description="Make app text easier to read. Your browser's zoom still works too."
            value={textSize}
            options={textSizeOptions}
            onChange={setTextSize}
          />
        </>
      )}

      {section === "notifications" && (
        <PreferenceGroup
          title="Follow request alerts"
          anchor="follow-request-alerts"
          description="Choose whether pending follow requests appear as a badge on the notification bell. You can always review requests from the bell."
          value={followRequestAlerts ? "on" : "off"}
          options={notificationOptions}
          onChange={(value) => setFollowRequestAlerts(value === "on")}
        />
      )}
    </div>
  );
}
