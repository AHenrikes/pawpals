"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useUsernameManager } from "@/hooks/core/fursonas/useUsernameManager";
import { useCleanupBlobUrl } from "@/hooks/useCleanupBlobUrl";
import useIsMobile from "@/hooks/useIsMobile";
import { useUser } from "@/providers/UserProvider";
import { cn } from "@repo/ui/lib/utils";
import { useReturnHeader } from "@/components/navigations/ReturnHeaderProvider";
import type { SettingsSectionId } from "./settingsSearch";
import EditProfileAside, { type EditProfileSection } from "./SettingsAside";
import SettingsAccount from "./SettingsAccount";
import SettingsProfile from "./SettingsProfile";
import SettingsApp from "./SettingsApp";
import SettingsPrivacy from "./SettingsPrivacy";

const sectionCopy = {
  account: {
    title: "My account",
    description:
      "Manage the private details and security of your Pawpals account.",
  },
  profile: {
    title: "Profiles & socials",
    description:
      "Make your fursona feel like you and connect your other spaces.",
  },
  privacy: {
    title: "Privacy & safety",
    description: "Decide who can see what you share.",
  },
  notifications: {
    title: "Notifications",
    description: "Choose which activity gets your attention.",
  },
  appearance: {
    title: "Appearance",
    description: "Make Pawpals comfortable on this device.",
  },
} as const;

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
  const { setOverride, searchQuery, setSearchQuery } = useReturnHeader();
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
  const formIdentity = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousSection = useRef<EditProfileSection>(activeSection);
  const [searchTarget, setSearchTarget] = useState<{
    anchor: string;
    request: number;
  } | null>(null);
  const mobileContentClass = isMobileSectionOpen
    ? "w-full md:flex-1"
    : "hidden md:block md:flex-1";
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
    if (mobileNavigation && isMobileViewport && searchQuery.trim()) {
      setIsMobileSectionOpen(false);
      setActiveSection(null);
    }
  }, [searchQuery, mobileNavigation, isMobileViewport]);

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
    const identity = `${account?.id ?? ""}:${currentFursona?.id ?? ""}`;
    if (formIdentity.current === identity) return;
    formIdentity.current = identity;
    resetForms();
  }, [account?.id, currentFursona?.id, resetForms]);

  useEffect(() => {
    if (
      previousSection.current !== activeSection &&
      isMobileViewport &&
      activeSection
    ) {
      headingRef.current?.focus();
    }
    previousSection.current = activeSection;
  }, [activeSection, isMobileViewport]);

  useEffect(() => {
    if (!searchTarget || !activeSection) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(searchTarget.anchor);
      target?.scrollIntoView({ block: "start", behavior: "auto" });
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeSection, searchTarget]);

  const openSearchResult = (section: SettingsSectionId, anchor: string) => {
    setSearchTarget((previous) => ({
      anchor,
      request: (previous?.request ?? 0) + 1,
    }));
    setActiveSection(section);
    setIsMobileSectionOpen(true);
  };

  return (
    <div
      className={cn(
        "settings-shell flex min-h-0 flex-1 bg-background",
        !mobileNavigation && "flex-col md:flex-row",
      )}
    >
      <EditProfileAside
        activeSection={activeSection}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        mobileNavigation={mobileNavigation}
        inactive={mobileNavigation && isMobileViewport && isMobileSectionOpen}
        hiddenOnMobile={mobileNavigation && isMobileSectionOpen}
        onSearchResult={openSearchResult}
        onSectionChange={(section) => {
          setSearchTarget(null);
          setActiveSection(section);
          setIsMobileSectionOpen(true);
        }}
      />

      <section
        inert={mobileNavigation && isMobileViewport && !isMobileSectionOpen}
        className={cn(
          "relative min-w-0 overflow-y-auto px-5 pb-12 pt-7 scrollbar-hide sm:px-10 md:px-12 md:pt-10",
          mobileNavigation ? mobileContentClass : "flex-1",
        )}
      >
        <div className="mx-auto w-full max-w-4xl">
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

          {activeSection === "privacy" && <SettingsPrivacy />}
          {activeSection === "appearance" && (
            <SettingsApp section="appearance" />
          )}
          {activeSection === "notifications" && (
            <SettingsApp section="notifications" />
          )}

          {activeSection === null && (
            <div className="grid place-content-center text-text-muted">
              <p>Choose a setting to get started.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
