"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { useUser } from "@/providers/UserProvider";
import type { ProfileVisibility } from "@/types/fursona";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/sonner";
import { LockKeyholeIcon, UsersIcon, Globe2Icon } from "lucide-react";

const choices = [
  {
    value: "public",
    label: "Everyone on Pawpals",
    description: "Any signed-in member can see your posts.",
    Icon: Globe2Icon,
    unavailable: false,
  },
  {
    value: "private",
    label: "Approved followers",
    description: "New followers need your approval to see your posts.",
    Icon: UsersIcon,
    unavailable: false,
  },
  {
    value: "subscribers_only",
    label: "Subscribers only",
    description: "Subscriptions are not available yet.",
    Icon: LockKeyholeIcon,
    unavailable: true,
  },
] as const;

export default function SettingsPrivacy() {
  const { currentFursona, refresh } = useUser();
  const [visibility, setVisibility] = useState<ProfileVisibility>(
    currentFursona?.visibility ?? "public",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setVisibility(currentFursona?.visibility ?? "public");
  }, [currentFursona?.id, currentFursona?.visibility]);

  const save = async () => {
    if (!currentFursona) return;
    setSaving(true);
    try {
      await api.patch(`/api/core/fursonas/${currentFursona.id}`, {
        visibility,
      });
      await refresh();
      toast.success("Post visibility updated");
    } catch (error) {
      toast.error(`Update failed: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (!currentFursona) {
    return (
      <div className="rounded-xl border border-border/50 bg-surface p-6 text-text-muted">
        Create a fursona to manage post visibility.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        id="post-visibility"
        tabIndex={-1}
        className="space-y-4 scroll-mt-6 focus:outline-none"
      >
        <div>
          <h2 className="text-lg font-bold text-text">
            Who can see your posts?
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Your profile is visible to signed-in members. Choose who can view
            its posts.
          </p>
        </div>
        <fieldset className="space-y-2 rounded-2xl border border-border/50 bg-surface p-4 sm:p-5">
          <legend className="sr-only">Post visibility</legend>
          {choices.map(({ value, label, description, Icon, unavailable }) => (
            <label
              key={value}
              className="flex min-h-18 cursor-pointer items-center gap-4 rounded-xl border border-border/50 p-4 has-checked:border-primary has-checked:bg-primary/10 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary has-disabled:cursor-not-allowed has-disabled:opacity-70"
            >
              <input
                type="radio"
                name="post-visibility"
                value={value}
                checked={visibility === value}
                onChange={() => setVisibility(value)}
                disabled={saving || unavailable}
                className="size-4 shrink-0 accent-primary"
              />
              <Icon
                className="size-5 shrink-0 text-text-muted"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-text">
                  {label}
                </span>
                <span className="mt-1 block text-xs text-text-muted">
                  {description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void save()}
            disabled={
              saving || visibility === (currentFursona.visibility ?? "public")
            }
          >
            {saving ? "Saving…" : "Save visibility"}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-surface p-5">
        <div className="flex gap-3">
          <LockKeyholeIcon
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-semibold text-text">Account security</h2>
            <p className="mt-1 text-sm text-text-muted">
              Email and phone changes are available in My account. Password and
              multi-factor controls will appear there when recovery verification
              is ready.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
