"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useUsernameManager } from "@/hooks/core/fursonas/useUsernameManager";
import { useCleanupBlobUrl } from "@/hooks/useCleanupBlobUrl";
import { useUser } from "@/providers/UserProvider";
import { SlidersHorizontalIcon } from "lucide-react";
import { TypographyH1 } from "@repo/ui/typography";
import EditProfileAside, { type EditProfileSection } from "./SettingsAside";
import SettingsAccount from "./SettingsAccount";
import SettingsProfile from "./SettingsProfile";

type EditProfilePanelProps = {
  initialSection?: EditProfileSection;
  onClose?: () => void;
};

export default function SettingsPage({
  initialSection = "account",
  onClose,
}: Readonly<EditProfilePanelProps>) {
  const { account, currentFursona, refresh } = useUser();
  const { checkAvailability, loading: usernameLoading } = useUsernameManager();
  const [activeSection, setActiveSection] =
    useState<EditProfileSection>(initialSection);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [species, setSpecies] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const usernameCheckId = useRef(0);

  useCleanupBlobUrl(avatarPreview);
  useCleanupBlobUrl(bannerPreview);

  const checkUsername = useDebouncedCallback(async (value: string) => {
    const checkId = ++usernameCheckId.current;
    const normalized = value.trim();
    if (!normalized) {
      setIsAvailable(false);
      return;
    }
    if (currentFursona?.username === normalized) {
      setIsAvailable(true);
      return;
    }
    const result = await checkAvailability(normalized);
    if (checkId === usernameCheckId.current) setIsAvailable(result.available);
  }, 450);

  useEffect(() => {
    if (activeSection !== "profile") return;
    setIsAvailable(null);
    void checkUsername(username);
    return () => checkUsername.cancel();
  }, [activeSection, checkUsername, username]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const resetForms = useCallback(() => {
    setFirstName(account?.firstname ?? "");
    setLastName(account?.lastname ?? "");
    setDisplayName(currentFursona?.display_name ?? "");
    setUsername(currentFursona?.username ?? "");
    setSpecies(currentFursona?.species ?? "");
    setPronouns(currentFursona?.pronouns ?? "");
    setBio(currentFursona?.bio ?? "");
    setAvatarPreview(currentFursona?.avatar_url ?? null);
    setBannerPreview(currentFursona?.banner_url ?? null);
    setAvatarFile(null);
    setBannerFile(null);
    setIsAvailable(null);
  }, [account, currentFursona]);

  useEffect(() => {
    resetForms();
  }, [resetForms]);

  return (
    <>
      <EditProfileAside
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <section className="relative flex-1 min-w-0 p-4 overflow-y-scroll scrollbar-hide sm:px-10 sm:pt-6 lg:pb-28">
        <div className="w-full max-w-5xl mx-auto">
          {activeSection === "account" && (
            <SettingsAccount
              firstName={firstName}
              lastName={lastName}
              setFirstName={setFirstName}
              setLastName={setLastName}
              saving={saving}
              setSaving={setSaving}
            />
          )}

          {activeSection === "profile" && !currentFursona && (
            <div className="glass-panel rounded-2xl border-dashed p-10 text-center text-text-muted">
              Create a fursona before editing your public profile.
            </div>
          )}

          {activeSection === "profile" && currentFursona && (
            <SettingsProfile
              avatarFile={avatarFile}
              avatarPreview={avatarPreview}
              bannerFile={bannerFile}
              bannerPreview={bannerPreview}
              bio={bio}
              currentFursona={currentFursona}
              displayName={displayName}
              isAvailable={isAvailable}
              onClose={onClose}
              pronouns={pronouns}
              refresh={refresh}
              resetForms={resetForms}
              saving={saving}
              setAvatarFile={setAvatarFile}
              setAvatarPreview={setAvatarPreview}
              setBannerFile={setBannerFile}
              setBannerPreview={setBannerPreview}
              setBio={setBio}
              setDisplayName={setDisplayName}
              setPronouns={setPronouns}
              setSaving={setSaving}
              setSpecies={setSpecies}
              setUsername={setUsername}
              species={species}
              username={username}
              usernameLoading={usernameLoading}
            />
          )}
        </div>
      </section>
    </>
  );
}
