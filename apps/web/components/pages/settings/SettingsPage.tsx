"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useUsernameManager } from "@/hooks/core/fursonas/useUsernameManager";
import { useCleanupBlobUrl } from "@/hooks/useCleanupBlobUrl";
import useIsMobile from "@/hooks/useIsMobile";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@repo/ui/lib/utils";
import { useReturnHeader } from "@/components/navigations/ReturnHeaderProvider";
import EditProfileAside, { type EditProfileSection } from "./SettingsAside";
import SettingsAccount from "./SettingsAccount";
import SettingsProfile from "./SettingsProfile";

type EditProfilePanelProps = {
  initialSection?: EditProfileSection;
  onClose?: () => void;
  mobileNavigation?: boolean;
};

export default function SettingsPage({
  initialSection,
  onClose,
  mobileNavigation = false,
}: Readonly<EditProfilePanelProps>) {
  const { account, currentFursona, refresh } = useUser();
  const { checkAvailability, loading: usernameLoading } = useUsernameManager();
  const isMobileViewport = useIsMobile();
  const [activeSection, setActiveSection] = useState<EditProfileSection>(
    initialSection ?? "profile",
  );
  const [isMobileSectionOpen, setIsMobileSectionOpen] = useState(false);
  const { setOverride } = useReturnHeader();
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
    if (isMobileSectionOpen) return;
    setActiveSection(
      mobileNavigation && isMobileViewport && initialSection == null
        ? null
        : (initialSection ?? "profile"),
    );
  }, [initialSection, isMobileViewport, isMobileSectionOpen, mobileNavigation]);

  useEffect(() => {
    if (!mobileNavigation || !isMobileViewport || !isMobileSectionOpen) {
      setOverride(null);
      return;
    }

    setOverride({
      // title: activeSection === "account" ? "My account" : "Profile",
      onBack: () => {
        setIsMobileSectionOpen(false);
        setActiveSection(null);
      },
    });
    return () => setOverride(null);
  }, [
    activeSection,
    isMobileSectionOpen,
    isMobileViewport,
    mobileNavigation,
    setOverride,
  ]);

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
    <div
      className={cn(
        "flex min-h-0 flex-1",
        mobileNavigation
          ? cn(
              "w-[200%] transition-transform duration-300 ease-in-out md:w-full md:translate-x-0",
              isMobileSectionOpen ? "-translate-x-1/2" : "translate-x-0",
            )
          : "flex-col md:flex-row",
      )}
    >
      <EditProfileAside
        activeSection={activeSection}
        mobileNavigation={mobileNavigation}
        onSectionChange={(section) => {
          setActiveSection(section);
          setIsMobileSectionOpen(true);
        }}
      />

      <section
        className={cn(
          "relative min-w-0 overflow-y-auto p-4 scrollbar-hide sm:px-10 sm:pt-6 lg:pb-28",
          mobileNavigation ? "w-1/2 shrink-0 md:w-auto md:flex-1" : "flex-1",
        )}
      >
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

          {activeSection === null && currentFursona && (
            <div className="grid place-content-center h-dvh overflow-hidden">
              <p>Choose a section</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
