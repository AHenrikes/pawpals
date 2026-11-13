"use client";

import { useEffect, useId, useState } from "react";
import { CircleCheckIcon, CircleIcon } from "lucide-react";
import { Button } from "@repo/ui/button";
import { safeSocialLinks } from "@/lib/validation/socialLinks";
import { TypographyH4, TypographySmall, TypographyXSmall } from "@repo/ui/typography";
import type { FursonaProfile } from "@/types/fursona";

export default function ProfileSetupCard({
  fursona,
  postsCount,
  onVisibilityChange,
}: Readonly<{
  fursona: FursonaProfile;
  postsCount: number;
  onVisibilityChange?: (visible: boolean) => void;
}>) {
  const titleId = useId();
  const storageKey = `profile-setup-skipped:${fursona.id}`;
  const [skipped, setSkipped] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const wasSkipped = sessionStorage.getItem(storageKey) === "true";
      setSkipped(wasSkipped);
      onVisibilityChange?.(!wasSkipped);
    } catch {
      setSkipped(false);
      onVisibilityChange?.(true);
    }
  }, [storageKey, onVisibilityChange]);

  if (skipped !== false) return null;

  const steps = [
    {
      label: "Add a profile picture",
      complete: Boolean(fursona.avatar_url?.trim()),
    },
    { label: "Introduce yourself", complete: Boolean(fursona.bio?.trim()) },
    {
      label: "Add a social link",
      complete: safeSocialLinks(fursona.social_links).length > 0,
    },
    {
      label: "Share your first post or photo",
      complete: postsCount > 0,
      comingSoon: true,
    },
  ];
  const completedCount = steps.filter((step) => step.complete).length;
  const availableCount = steps.filter(
    (step) => !step.comingSoon || step.complete,
  ).length;

  const skipForNow = () => {
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {
      // Dismiss the card for this visit even if storage is unavailable.
    }
    setSkipped(true);
    onVisibilityChange?.(false);
  };

  return (
    <section
      aria-labelledby={titleId}
      className="space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-text md:block"
    >
      <div>
        <span className="flex justify-between items-center">
          <TypographyH4 id={titleId}>Make yourself at home</TypographyH4>

          <TypographyXSmall className="text-text-muted">
            {completedCount} of {availableCount}
          </TypographyXSmall>
        </span>

        <TypographyXSmall className="text-text-muted">A few steps to help others get to know you.</TypographyXSmall>
      </div>

      <ul className="mt-3 space-y-2">
        {steps.map(({ label, complete }) => {

          return (
            <li
              key={label}
              className="flex items-center gap-3 p-1"
            >
              <span aria-hidden="true">
                {complete ? (
                  <CircleCheckIcon className="fill-primary text-background" />
                ) : (
                  <CircleIcon className="text-text/40" />
                )}
              </span>

              <TypographySmall className={complete ? "text-text-muted text-xs" : "text-text"}>{label}</TypographySmall>
            </li>
          );
        })}
      </ul>

      <Button
        variant="ghost"
        onClick={skipForNow}
      >
        Skip for now
      </Button>
    </section>
  );
}
