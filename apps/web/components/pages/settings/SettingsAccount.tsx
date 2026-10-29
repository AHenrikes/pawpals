"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
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
  const supabase = useSupabaseClient();
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [contactSaving, setContactSaving] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(
    () => account?.dob?.toISOString().slice(0, 10) ?? "",
  );
  const verified = Boolean(account?.age_verified_at);
  useEffect(() => {
    if (!editingDetails)
      setDateOfBirth(account?.dob?.toISOString().slice(0, 10) ?? "");
  }, [account?.dob, editingDetails]);
  useEffect(() => {
    if (!editingEmail) setEmailDraft(account?.email ?? "");
    if (!editingPhone) setPhoneDraft(account?.phoneNumber ?? "");
  }, [account?.email, account?.phoneNumber, editingEmail, editingPhone]);
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted || error) return;
      const nextEmail = data.user?.new_email;
      const nextPhone = data.user?.new_phone;
      if (nextEmail && nextEmail !== account?.email) setPendingEmail(nextEmail);
      if (nextPhone && nextPhone !== account?.phoneNumber)
        setPendingPhone(nextPhone);
    });
    return () => {
      mounted = false;
    };
  }, [supabase, account?.email, account?.phoneNumber]);
  const detailsChanged =
    firstName.trim() !== (account?.firstname ?? "") ||
    lastName.trim() !== (account?.lastname ?? "") ||
    dateOfBirth !== (account?.dob?.toISOString().slice(0, 10) ?? "");

  const accountStatus =
    ({
      at_risk: "At risk of suspension",
      suspended: "Suspended",
      closed: "Closed",
    } as Record<string, string>)[account?.status ?? ""] ?? "Active";

  const cancelEditing = () => {
    setFirstName(account?.firstname ?? "");
    setLastName(account?.lastname ?? "");
    setDateOfBirth(account?.dob?.toISOString().slice(0, 10) ?? "");
    setEditingDetails(false);
  };

  const saveAccount = async () => {
    setSaving(true);
    try {
      await api.patch("/api/core/accounts", {
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        dob: dateOfBirth || null,
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

  const requestEmailChange = async () => {
    const email = emailDraft.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (email === account?.email?.toLowerCase()) {
      setEditingEmail(false);
      return;
    }
    setContactSaving(true);
    try {
      const next = encodeURIComponent(window.location.pathname);
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}/confirm?next=${next}` },
      );
      if (error) throw error;
      setPendingEmail(email);
      setEditingEmail(false);
      toast.success(
        "Confirm the change using the links sent to both email addresses.",
      );
    } catch (error) {
      toast.error(`Email change failed: ${getErrorMessage(error)}`);
    } finally {
      setContactSaving(false);
    }
  };

  const requestPhoneChange = async () => {
    const phone = phoneDraft.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      toast.error(
        "Enter a phone number with country code, such as +358401234567.",
      );
      return;
    }
    if (phone === account?.phoneNumber) {
      setEditingPhone(false);
      return;
    }
    setContactSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ phone });
      if (error) throw error;
      setPendingPhone(phone);
      setPhoneCode("");
      setEditingPhone(false);
      toast.success("A verification code was sent to the new phone number.");
    } catch (error) {
      toast.error(`Phone change failed: ${getErrorMessage(error)}`);
    } finally {
      setContactSaving(false);
    }
  };

  const confirmPhoneChange = async () => {
    if (!pendingPhone || !/^\d{6,10}$/.test(phoneCode.trim())) {
      toast.error("Enter the verification code from the text message.");
      return;
    }
    setContactSaving(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: phoneCode.trim(),
        type: "phone_change",
      });
      if (error) throw error;
      await refresh();
      setPendingPhone(null);
      setPhoneCode("");
      toast.success("Phone number verified and updated.");
    } catch (error) {
      toast.error(`Verification failed: ${getErrorMessage(error)}`);
    } finally {
      setContactSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20">
      <section className="space-y-4">
        <div>
          <TypographyH3>Account information</TypographyH3>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
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
            <div className="flex justify-between items-center">
              <Label htmlFor="account-first-name" variant="muted">
                First name
              </Label>

              {!editingDetails && !verified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDetails(true)}
                  className="sm:hidden"
                >
                  Edit
                </Button>
              )}
            </div>

            {editingDetails && !verified ? (
              <Input
                id="account-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={saving}
                maxLength={80}
                className="max-w-72"
              />
            ) : (
              <TypographySmall>{firstName || "Not provided"}</TypographySmall>
            )}
            {!editingDetails && !verified && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDetails(true)}
                className="hidden sm:block"
              >
                Edit
              </Button>
            )}
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <Label htmlFor="account-last-name" variant="muted">
              Last name
            </Label>

            {editingDetails && !verified ? (
              <Input
                id="account-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={saving}
                maxLength={80}
                className="max-w-72"
              />
            ) : (
              <TypographySmall>{lastName || "Not provided"}</TypographySmall>
            )}
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <div className="flex justify-between items-center">
              <Label htmlFor="account-email" variant="muted">
                Email
              </Label>

              {!editingEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={contactSaving}
                  onClick={() => setEditingEmail(true)}
                  className="sm:hidden"
                >
                  Edit
                </Button>
              )}
            </div>

            {editingEmail ? (
              <Input
                id="account-email"
                type="email"
                autoComplete="email"
                value={emailDraft}
                onChange={(event) => setEmailDraft(event.target.value)}
                disabled={contactSaving}
                className="min-w-52 max-w-72"
              />
            ) : (
              <TypographySmall>{account?.email}</TypographySmall>
            )}
            {editingEmail ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={contactSaving}
                  onClick={() => setEditingEmail(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={contactSaving}
                  onClick={requestEmailChange}
                >
                  Send confirmation
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={contactSaving}
                onClick={() => setEditingEmail(true)}
                className="hidden sm:block"
              >
                Edit
              </Button>
            )}
          </div>

          {pendingEmail && (
            <p className="p-5 text-sm text-text-muted">
              Confirm the change to {pendingEmail} using the links sent to your
              current and new email addresses. Your current address stays active
              until confirmation is complete.
            </p>
          )}

          <div className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <Label variant="muted">Date of birth</Label>

            {editingDetails && !verified ? (
              <Input
                type="date"
                value={dateOfBirth}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDateOfBirth(event.target.value)}
                disabled={saving}
                className="w-fit"
              />
            ) : (
              <TypographySmall>{formatDate(account?.dob)}</TypographySmall>
            )}
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
            <div className="flex justify-between items-center">
              <Label htmlFor="account-phone" variant="muted">
                Phone number
              </Label>

              {!editingPhone && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={contactSaving}
                  onClick={() => setEditingPhone(true)}
                  className="sm:hidden"
                >
                  {account?.phoneNumber ? "Edit" : "Add"}
                </Button>
              )}
            </div>

            {editingPhone ? (
              <Input
                id="account-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+358401234567"
                value={phoneDraft}
                onChange={(event) => setPhoneDraft(event.target.value)}
                disabled={contactSaving}
                className="min-w-52 max-w-72"
              />
            ) : (
              <TypographySmall>
                {account?.phoneNumber || "Not provided"}
              </TypographySmall>
            )}

            {editingPhone ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={contactSaving}
                  onClick={() => setEditingPhone(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={contactSaving}
                  onClick={requestPhoneChange}
                >
                  Send code
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={contactSaving}
                onClick={() => setEditingPhone(true)}
                className="hidden sm:block"
              >
                {account?.phoneNumber ? "Edit" : "Add"}
              </Button>
            )}
          </div>

          {pendingPhone && (
            <div className="grid gap-3 p-5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
              <Label htmlFor="account-phone-code" variant="muted">
                Verification code
              </Label>
              <Input
                id="account-phone-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={phoneCode}
                onChange={(event) => setPhoneCode(event.target.value)}
                placeholder={`Code sent to ${pendingPhone}`}
                disabled={contactSaving}
              />
              <Button
                size="sm"
                disabled={contactSaving}
                onClick={confirmPhoneChange}
              >
                Verify phone
              </Button>
            </div>
          )}

          {verified && (
            <p className="p-5 text-sm text-text-muted">
              Your verified name and date of birth are locked.
            </p>
          )}

          {editingDetails && !verified && (
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
        <div className="glass-panel grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-xl bg-primary/8 p-4">
            <TypographyXSmall className="flex items-center gap-1.5 text-text-muted">
              <CalendarDaysIcon className="size-3.5" />
              Member since
            </TypographyXSmall>

            <TypographySmall>{formatDate(account?.created_at)}</TypographySmall>
          </div>

          <div className="flex flex-col gap-1 rounded-xl bg-primary/8 p-4">
            <TypographyXSmall className="text-text-muted">
              Age group
            </TypographyXSmall>

            <TypographySmall>{getAgeGroup(account?.dob)}</TypographySmall>
          </div>

          <div className="flex flex-col gap-1 rounded-xl bg-primary/8 p-4">
            <TypographyXSmall className="flex items-center gap-1.5 text-text-muted">
              <CheckCircle2Icon className="size-3.5" />
              Account record
            </TypographyXSmall>

            <TypographySmall>{accountStatus}</TypographySmall>
          </div>

          <div className="flex flex-col gap-1 rounded-xl bg-primary/8 p-4">
            <TypographyXSmall className="text-text-muted">
              Age verification
            </TypographyXSmall>

            <TypographySmall>
              {verified ? "Verified" : "Not verified"}
            </TypographySmall>
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
