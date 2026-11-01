"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@repo/ui/lib/utils";
import { TypographyH3 } from "@repo/ui/typography";
import { useAppPreferences } from "@/providers/AppPreferencesProvider";

type Option<T extends string> = {
  value: T;
  label: string;
  description: string;
};

function PreferenceGroup<T extends string>({
  title,
  description,
  value,
  options,
  onChange,
  disabled = false,
}: Readonly<{
  title: string;
  description: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}>) {
  return (
    <section className="space-y-4">
      <div>
        <TypographyH3>{title}</TypographyH3>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      <div
        className="glass-panel grid gap-3 rounded-2xl p-4 sm:grid-cols-3 sm:p-5"
        role="group"
        aria-label={title}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={!disabled && value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "glass-control min-h-24 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait",
              !disabled && value === option.value
                ? "border-primary bg-primary/15"
                : "border-border/40 hover:border-primary/50",
            )}
          >
            <span className="block text-sm font-semibold text-text">
              {option.label}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-text-muted">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </section>
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

export default function SettingsApp() {
  const { theme, setTheme } = useTheme();
  const {
    motion,
    setMotion,
    textSize,
    setTextSize,
    followRequestAlerts,
    setFollowRequestAlerts,
  } = useAppPreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="w-full space-y-8">
      <PreferenceGroup
        title="Theme"
        description="Choose how the app looks on this device. Your public profile has its own theme."
        value={
          mounted &&
          (theme === "light" || theme === "dark" || theme === "system")
            ? theme
            : "system"
        }
        options={themeOptions}
        onChange={setTheme}
        disabled={!mounted}
      />

      <PreferenceGroup
        title="Animations"
        description="Control movement throughout the app, including page transitions."
        value={motion}
        options={motionOptions}
        onChange={setMotion}
      />

      <PreferenceGroup
        title="Text size"
        description="Make app text easier to read. Your browser's zoom still works too."
        value={textSize}
        options={textSizeOptions}
        onChange={setTextSize}
      />

      <PreferenceGroup
        title="Follow request alerts"
        description="Choose whether pending follow requests appear as a badge on the notification bell. You can always review requests from the bell."
        value={followRequestAlerts ? "on" : "off"}
        options={notificationOptions}
        onChange={(value) => setFollowRequestAlerts(value === "on")}
      />
    </div>
  );
}
