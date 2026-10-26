"use client";

import { useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { toast } from "@repo/ui/sonner";
import {
  TypographyH3,
  TypographySmall,
  TypographyXSmall,
} from "@repo/ui/typography";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  Loader2Icon,
  LockKeyholeIcon,
  ShieldCheckIcon,
} from "lucide-react";

interface SettingsAccountProps {
  firstName: string;
  lastName: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setSaving: (saving: boolean) => void;
  saving: boolean;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "Not provided";
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getAgeGroup(date: Date | null | undefined) {
  if (!date) return "Not provided";
  const today = new Date();
  const birthDate = new Date(date);
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 18 ? "Adult" : "Under 18";
}

export default function SettingsAccount({
  firstName,
  lastName,
  setFirstName,
  setLastName,
  setSaving,
  saving,
}: Readonly<SettingsAccountProps>) {
  const { account, refresh } = useUser();
  const [editingDetails, setEditingDetails] = useState(false);
  const detailsChanged =
    firstName.trim() !== (account?.firstname ?? "") ||
    lastName.trim() !== (account?.lastname ?? "");

  const cancelEditing = () => {
    setFirstName(account?.firstname ?? "");
    setLastName(account?.lastname ?? "");
    setEditingDetails(false);
  };

  const saveAccount = async () => {
    setSaving(true);
    try {
      await api.patch("/api/core/accounts", {
        firstname: firstName.trim(),
        lastname: lastName.trim(),
      });
      await refresh();
      setEditingDetails(false);
      toast.success("Account details updated");
    } catch (error) {
      toast.error(`Update failed: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <section className="space-y-4">
        <div>
          <TypographyH3>Account information</TypographyH3>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <p className="mt-1 text-sm text-text-muted">
              Your personal details and contact information.
            </p>

            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <ShieldCheckIcon className="size-4" />
              This information is never shown on your profile.
            </p>
          </div>
        </div>

        <div className="glass-panel divide-y divide-border/30 overflow-hidden rounded-2xl">
          <div className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <Label htmlFor="account-first-name" variant="muted">
              First name
            </Label>
            {editingDetails ? (
              <Input
                id="account-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={saving}
                maxLength={80}
              />
            ) : (
              <TypographySmall>{firstName || "Not provided"}</TypographySmall>
            )}
            {!editingDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDetails(true)}
              >
                Edit
              </Button>
            )}
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <Label htmlFor="account-last-name" variant="muted">
              Last name
            </Label>
            {editingDetails ? (
              <Input
                id="account-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={saving}
                maxLength={80}
              />
            ) : (
              <TypographySmall>{lastName || "Not provided"}</TypographySmall>
            )}
            {!editingDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDetails(true)}
              >
                Edit
              </Button>
            )}
          </div>

          <div className="grid gap-2 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <Label variant="muted">Email</Label>
            <TypographySmall>{account?.email}</TypographySmall>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <Label variant="muted">Date of birth</Label>
            <TypographySmall>{formatDate(account?.dob)}</TypographySmall>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <Label variant="muted">Phone number</Label>
            <TypographySmall>
              {account?.phoneNumber || "Not provided"}
            </TypographySmall>
          </div>

          {editingDetails && (
            <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={cancelEditing} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={saveAccount}
                disabled={saving || !detailsChanged}
              >
                {saving && <Loader2Icon className="animate-spin" />}Save changes
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <TypographyH3>Password & security</TypographyH3>
          <p className="mt-1 text-sm text-text-muted">
            Protect access to your Pawpals account.
          </p>
        </div>
        <div className="glass-panel divide-y divide-border/30 overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-3">
              <LockKeyholeIcon className="size-5 text-text-muted" />
              <span>
                <TypographySmall>Password</TypographySmall>
                <TypographyXSmall className="block text-text-muted">
                  Password changes require a verified recovery session.
                </TypographyXSmall>
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Password management is coming soon"
            >
              Coming soon
            </Button>
          </div>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-3">
              <ShieldCheckIcon className="size-5 text-text-muted" />
              <span>
                <TypographySmall>Multi-factor authentication</TypographySmall>
                <TypographyXSmall className="block text-text-muted">
                  Add another layer of protection to your account.
                </TypographyXSmall>
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Multi-factor authentication is coming soon"
            >
              Coming soon
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <TypographyH3>Account status</TypographyH3>
          <p className="mt-1 text-sm text-text-muted">
            A quick overview of your membership.
          </p>
        </div>
        <div className="glass-panel grid gap-4 rounded-2xl p-5 sm:grid-cols-3">
          <div className="rounded-xl bg-primary/8 p-4">
            <TypographyXSmall className="flex items-center gap-1.5 text-text-muted">
              <CalendarDaysIcon className="size-3.5" />
              Member since
            </TypographyXSmall>
            <TypographySmall>{formatDate(account?.created_at)}</TypographySmall>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-primary/8 p-4 md:flex-col md:items-start">
            <TypographyXSmall className="text-text-muted">
              Age group
            </TypographyXSmall>
            <TypographySmall>{getAgeGroup(account?.dob)}</TypographySmall>
          </div>

          <div className="rounded-xl bg-primary/8 p-4">
            <TypographyXSmall className="flex items-center gap-1.5 text-text-muted">
              <CheckCircle2Icon className="size-3.5" />
              Account record
            </TypographyXSmall>
            <TypographySmall>Active</TypographySmall>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-destructive/25 bg-destructive/8 p-5 backdrop-blur-xl">
        <div>
          <TypographyH3>Danger zone</TypographyH3>
          <p className="mt-1 text-sm text-text-muted">
            Disabling and deleting accounts will be available after recovery
            verification is added.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" disabled>
            Disable account
          </Button>
          <Button variant="destructive" disabled>
            Delete account
          </Button>
        </div>
      </section>
    </div>
  );
}
