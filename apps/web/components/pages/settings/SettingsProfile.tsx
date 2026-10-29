"use client";

import Image from "next/image";
import {
  useMemo,
  useRef,
  useState,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePageTransition } from "@/components/transitions/PageTransitionProvider";
import { api } from "@/lib/api/api-client";
import { getErrorMessage } from "@/lib/helpers/error-utils";
import { uploadFursonaImage } from "@/lib/uploads/fursonaMedia";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/uploads/imageLimits";
import { mediaImageLoader } from "@/lib/uploads/mediaImageLoader";
import { cn } from "@/lib/helpers/utils";
import type {
  FursonaTypes,
  ProfileAchievement,
  ProfileSocialLink,
  ProfileSocialPlatform,
  ProfileVisibility,
} from "@/types/fursona";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { toast } from "@repo/ui/sonner";
import { TypographyH3 } from "@repo/ui/typography";
import {
  AtSignIcon,
  AwardIcon,
  CameraIcon,
  CheckIcon,
  EyeIcon,
  Globe2Icon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import usePlatformOption from "@/hooks/usePlatformOption";
import useAchievement from "@/hooks/useAchievement";

type SettingsProfileProps = {
  currentFursona: FursonaTypes;
  usernameLoading: boolean;
  displayName: string;
  setDisplayName: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  isAvailable: boolean | null;
  species: string;
  setSpecies: (value: string) => void;
  pronouns: string;
  setPronouns: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  avatarFile: File | null;
  setAvatarFile: (value: File | null) => void;
  avatarPreview: string | null;
  setAvatarPreview: Dispatch<SetStateAction<string | null>>;
  bannerFile: File | null;
  setBannerFile: (value: File | null) => void;
  bannerPreview: string | null;
  setBannerPreview: Dispatch<SetStateAction<string | null>>;
  resetForms: () => void;
  saving: boolean;
  setSaving: (value: boolean) => void;
  refresh: () => Promise<void>;
  onClose?: () => void;
};

function UsernameStatus({
  loading,
  available,
}: Readonly<{ loading: boolean; available: boolean | null }>) {
  if (loading)
    return <Loader2Icon className="size-4 animate-spin text-text-muted" />;
  if (available === true)
    return <CheckIcon className="size-4 text-confirmative" />;
  if (available === false) return <XIcon className="size-4 text-destructive" />;
  return null;
}

function PreferenceToggle({
  checked,
  onChange,
  label,
  description,
}: Readonly<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="glass-control flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-xs text-text-muted">
          {description}
        </span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
      </span>
    </button>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-5">
      <div>
        <TypographyH3>{title}</TypographyH3>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>

      <div className="glass-panel space-y-4 rounded-2xl p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

export default function SettingsProfile(props: Readonly<SettingsProfileProps>) {
  const {
    currentFursona,
    usernameLoading,
    displayName,
    setDisplayName,
    username,
    setUsername,
    isAvailable,
    species,
    setSpecies,
    pronouns,
    setPronouns,
    bio,
    setBio,
    avatarFile,
    setAvatarFile,
    avatarPreview,
    setAvatarPreview,
    bannerFile,
    setBannerFile,
    bannerPreview,
    setBannerPreview,
    resetForms,
    saving,
    setSaving,
    refresh,
    onClose,
  } = props;
  const { navigate } = usePageTransition();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const platformOptions = usePlatformOption();
  const achievements = useAchievement();
  const [newChange, setNewChange] = useState(false);

  const [visibility, setVisibility] = useState<ProfileVisibility>(
    currentFursona.visibility ?? "public",
  );

  const [profileTheme, setProfileTheme] = useState<"light" | "dark">(currentFursona.profile_theme ?? "dark");

  const [socialLinks, setSocialLinks] = useState<ProfileSocialLink[]>(
    currentFursona.social_links ?? [],
  );

  const [showEvents, setShowEvents] = useState(
    currentFursona.show_events ?? true,
  );

  const [showCommunities, setShowCommunities] = useState(
    currentFursona.show_communities ?? true,
  );

  const [featuredAchievements, setFeaturedAchievements] = useState<
    ProfileAchievement[]
  >(currentFursona.featured_achievements ?? []);

  const selectedAchievementDetails = useMemo(
    () => achievements.filter((item) => featuredAchievements.includes(item.id)),
    [featuredAchievements],
  );

  const visibilityLabel = {
    public: "Visible to everyone",
    followers_only: "Visible to followers",
    private: "Visible to approved followers",
  }[visibility];

  const resetProfile = () => {
    resetForms();
    setVisibility(currentFursona.visibility ?? "public");
    setProfileTheme(currentFursona.profile_theme ?? "dark");
    setSocialLinks(currentFursona.social_links ?? []);
    setShowEvents(currentFursona.show_events ?? true);
    setShowCommunities(currentFursona.show_communities ?? true);
    setFeaturedAchievements(currentFursona.featured_achievements ?? []);
    setNewChange(false);
  };

  useEffect(() => {
    setVisibility(currentFursona.visibility ?? "public");
    setProfileTheme(currentFursona.profile_theme ?? "dark");
    setSocialLinks(currentFursona.social_links ?? []);
    setShowEvents(currentFursona.show_events ?? true);
    setShowCommunities(currentFursona.show_communities ?? true);
    setFeaturedAchievements(currentFursona.featured_achievements ?? []);
    setNewChange(false);
  }, [currentFursona]);

  const updateSocial = (index: number, updates: Partial<ProfileSocialLink>) => {
    setSocialLinks((links) =>
      links.map((link, itemIndex) =>
        itemIndex === index ? { ...link, ...updates } : link,
      ),
    );
    setNewChange(true);
  };

  const removeSocial = (index: number) => {
    setSocialLinks((links) =>
      links.filter((_, itemIndex) => itemIndex !== index),
    );
    setNewChange(true);
  };

  const addSocial = () => {
    if (socialLinks.length < 6) {
      setSocialLinks((links) => [...links, { platform: "website", url: "" }]);
      setNewChange(true);
    }
  };

  const toggleAchievement = (id: ProfileAchievement) => {
    setFeaturedAchievements((selected) => {
      if (selected.includes(id)) return selected.filter((item) => item !== id);
      if (selected.length >= 3) {
        toast.error("Choose up to 3 achievements.");
        return selected;
      }
      setNewChange(true);
      return [...selected, id];
    });
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      toast.error("Choose a PNG, JPEG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`${type === "banner" ? "Banner" : "Avatar"} is too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} MiB.`);
      event.target.value = "";
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (type === "avatar") {
      if (avatarPreview?.startsWith("blob:"))
        URL.revokeObjectURL(avatarPreview);
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
      setNewChange(true);
    } else {
      if (bannerPreview?.startsWith("blob:"))
        URL.revokeObjectURL(bannerPreview);
      setBannerFile(file);
      setBannerPreview(previewUrl);
      setNewChange(true);
    }
  };

  const saveProfile = async () => {
    if (!displayName.trim() || !username.trim()) {
      toast.error("Display name and username are required");
      return;
    }
    if (isAvailable === false) {
      toast.error("Choose an available username");
      return;
    }
    if (socialLinks.some((link) => !link.url.trim())) {
      toast.error("Complete or remove empty social links.");
      return;
    }
    setSaving(true);
    try {
      const [avatarUrl, bannerUrl] = await Promise.all([
        avatarFile
          ? uploadFursonaImage(avatarFile, currentFursona.id, "fursona-avatars")
          : Promise.resolve(null),
        bannerFile
          ? uploadFursonaImage(bannerFile, currentFursona.id, "fursona-banners")
          : Promise.resolve(null),
      ]);
      const nextUsername = username.trim();
      if (nextUsername !== currentFursona.username)
        await api.post(
          `/api/core/fursonas/${currentFursona.id}/change-username`,
          { new_username: nextUsername },
        );
      await api.patch(`/api/core/fursonas/${currentFursona.id}`, {
        display_name: displayName.trim(),
        species,
        pronouns,
        bio,
        visibility,
        profile_theme: profileTheme,
        social_links: socialLinks.map((link) => ({
          ...link,
          url: link.url.trim(),
        })),
        show_events: showEvents,
        show_communities: showCommunities,
        featured_achievements: featuredAchievements,
        ...(avatarUrl && { avatar_url: avatarUrl }),
        ...(bannerUrl && { banner_url: bannerUrl }),
      });
      await refresh();
      setNewChange(false);
      toast.success("Profile settings saved");
      if (onClose && nextUsername !== currentFursona.username)
        navigate(`/@${nextUsername}`, { replace: true });
      onClose?.();
    } catch (error) {
      toast.error(`Update failed: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-20">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
        <div className="space-y-6">
          <SettingsSection
            title="Profile information"
            description="Shape what people see when they visit your active fursona."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-display-name" variant="muted">
                  Display name
                </Label>
                <Input
                  id="profile-display-name"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value);
                    setNewChange(true);
                  }}
                  disabled={saving}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-username" variant="muted">
                  Username
                </Label>
                <div className="relative">
                  <AtSignIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="profile-username"
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setNewChange(true);
                    }}
                    disabled={saving}
                    error={isAvailable === false}
                    className="pr-9 pl-9"
                  />
                  <span className="absolute top-1/2 right-3 -translate-y-1/2">
                    <UsernameStatus
                      loading={usernameLoading}
                      available={isAvailable}
                    />
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-species" variant="muted">
                  Species
                </Label>
                <Input
                  id="profile-species"
                  value={species}
                  onChange={(event) => {
                    setSpecies(event.target.value);
                    setNewChange(true);
                  }}
                  placeholder="e.g. Arctic fox"
                  disabled={saving}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-pronouns" variant="muted">
                  Pronouns
                </Label>
                <Input
                  id="profile-pronouns"
                  value={pronouns}
                  onChange={(event) => {
                    setPronouns(event.target.value);
                    setNewChange(true);
                  }}
                  placeholder="e.g. they/them"
                  disabled={saving}
                  maxLength={30}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="profile-bio" variant="muted">
                  About me
                </Label>
                <span className="text-xs text-text-muted">
                  {bio.length}/190
                </span>
              </div>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                  setNewChange(true);
                }}
                maxLength={190}
                rows={5}
                disabled={saving}
                placeholder="A little something about your fursona..."
                className="bg-surface/55 backdrop-blur-lg rounded-md focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-primary/20"
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Socials"
            description="Add up to six places where people can find you."
          >
            <div className="space-y-3">
              {socialLinks.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/40 p-5 text-center text-sm text-text-muted">
                  No social links yet.
                </div>
              )}
              {socialLinks.map((link, index) => (
                <div
                  key={`${link.platform}-${index}`}
                  className="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_auto]"
                >
                  <select
                    aria-label={`Social platform ${index + 1}`}
                    value={link.platform}
                    onChange={(event) =>
                      updateSocial(index, {
                        platform: event.target.value as ProfileSocialPlatform,
                      })
                    }
                    className="h-11 rounded-lg border border-border/60 bg-surface/55 px-3 text-sm outline-none backdrop-blur-lg focus:border-primary/60 focus:ring-3 focus:ring-primary/20"
                  >
                    {platformOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="url"
                    inputMode="url"
                    value={link.url}
                    onChange={(event) =>
                      updateSocial(index, { url: event.target.value })
                    }
                    placeholder="https://..."
                    maxLength={300}
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      removeSocial(index);
                    }}
                    aria-label={`Remove ${link.platform} link`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                addSocial();
                setNewChange(true);
              }}
              disabled={saving || socialLinks.length >= 6}
            >
              <PlusIcon />
              Add social
            </Button>
          </SettingsSection>

          <SettingsSection
            title="Profile privacy"
            description="Choose who can view your content."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: "public" as const,
                  label: "Public",
                  detail: "Anyone can view",
                  Icon: Globe2Icon,
                },
                {
                  value: "followers_only" as const,
                  label: "Followers only",
                  detail: "Approved followers",
                  Icon: UsersIcon,
                },
                {
                  value: "private" as const,
                  label: "Private",
                  detail: "Approved followers",
                  Icon: LockIcon,
                },
              ].map(({ value, label, detail, Icon }) => (
                <Button
                  key={value}
                  variant={"secondary"}
                  onClick={() => {
                    setVisibility(value);
                    setNewChange(true);
                  }}
                  className={cn(
                    "flex-col items-start min-h-32 gap-0 rounded-xl border p-4 text-left transition-colors duration-250",
                    visibility === value
                      ? "border-primary/60 bg-primary/15 shadow-lg shadow-primary/10"
                      : "border-border/40 bg-surface/35 hover:border-primary/35 hover:bg-surface/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "mb-3 size-5",
                      visibility === value ? "text-primary" : "text-text-muted",
                    )}
                  />
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-1 block text-xs text-text-muted">
                    {detail}
                  </span>
                </Button>
              ))}
            </div>
            {visibility !== "public" && (
              <p className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-xs text-text-muted">
                <ShieldCheckIcon className="size-4 text-primary" />
                New follow requests require your approval before they can view
                the profile.
              </p>
            )}
          </SettingsSection>

          <SettingsSection title="Profile theme" description="Visitors see this profile in your chosen theme without changing their app theme.">
            <div className="flex gap-2">
              {(["light", "dark"] as const).map((theme) => <Button key={theme} type="button" variant={profileTheme === theme ? "default" : "outline"} onClick={() => { setProfileTheme(theme); setNewChange(true); }}>{theme === "light" ? "Light" : "Dark"}</Button>)}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Profile sections"
            description="Control which activity summaries visitors can see."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <PreferenceToggle
                checked={showEvents}
                onChange={(value) => {
                  setShowEvents(value);
                  setNewChange(true);
                }}
                label="Events joined"
                description="Show event participation."
              />
              <PreferenceToggle
                checked={showCommunities}
                onChange={(value) => {
                  setShowCommunities(value);
                  setNewChange(true);
                }}
                label="Communities"
                description="Show joined communities."
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Featured achievements"
            description="Choose up to three achievements to highlight on your profile."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {achievements.map((achievement) => {
                const selected = featuredAchievements.includes(achievement.id);
                return (
                  <button
                    key={achievement.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleAchievement(achievement.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      selected
                        ? "border-primary/60 bg-primary/15 shadow-sm shadow-primary/10"
                        : "border-border/40 bg-surface/35 hover:border-primary/35 hover:bg-surface/60",
                    )}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {achievement.symbol}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {achievement.name}
                        {selected && (
                          <CheckIcon className="size-4 text-primary" />
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-text-muted">
                        {achievement.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-muted">
              {featuredAchievements.length}/3 selected
            </p>
          </SettingsSection>
        </div>

        <aside className="xl:sticky xl:top-7">
          <p className="mb-2 text-xs font-semibold tracking-widest text-text-muted uppercase">
            Live preview
          </p>
          <div className="glass-panel overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="group relative block h-28 w-full cursor-pointer overflow-hidden bg-primary-dim"
              aria-label="Change banner"
            >
              {bannerPreview && (
                <Image
                  src={bannerPreview}
                  loader={bannerPreview.startsWith("/api/media/") ? mediaImageLoader : undefined}
                  alt="Profile banner preview"
                  fill
                  sizes="288px"
                  className="object-cover"
                />
              )}
              <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <CameraIcon className="size-6 text-white" />
              </span>
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => handleImageChange(event, "banner")}
            />
            <div className="px-4 pb-5">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="group relative -mt-9 block size-20 cursor-pointer overflow-hidden rounded-full border-4 border-surface bg-muted shadow-xl"
                aria-label="Change avatar"
              >
                {avatarPreview && (
                  <Image
                    src={avatarPreview}
                    loader={avatarPreview.startsWith("/api/media/") ? mediaImageLoader : undefined}
                    alt="Avatar preview"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
                <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <CameraIcon className="size-5 text-white" />
                </span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => handleImageChange(event, "avatar")}
              />
              <p className="mt-3 truncate text-lg font-bold">
                {displayName || "Display name"}
              </p>
              <p className="truncate text-sm text-text-muted">
                @{username || "username"}
              </p>
              <div className="my-4 h-px bg-border/20" />
              <p className="text-xs font-bold uppercase">About me</p>
              <p className="mt-1 wrap-break-word text-sm text-text-muted">
                {bio || "Your bio will appear here."}
              </p>
              {selectedAchievementDetails.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase">
                    <AwardIcon className="size-3.5" />
                    Achievements
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAchievementDetails.map((item) => (
                      <span
                        key={item.id}
                        title={item.name}
                        className="grid size-9 place-items-center rounded-full bg-primary/15 text-lg"
                      >
                        {item.symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/15 px-2 py-1 text-xs">
                  Reputation
                </span>
                {showEvents && (
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-xs">
                    Events
                  </span>
                )}
                {showCommunities && (
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-xs">
                    Communities
                  </span>
                )}
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-text-muted">
                <EyeIcon className="size-3.5" />
                {visibilityLabel}
              </p>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-text-muted">
            Click the banner or avatar to replace it.
          </p>
        </aside>
      </div>

      <div
        className={cn(
          "z-20 -mx-4 flex flex-col-reverse gap-2 border-t border-white/10 p-4 shadow-black/10 backdrop-blur-2xl sm:mx-0 sm:flex-row sm:justify-end sm:bg-background/75 sm:rounded-2xl sm:border sm:shadow-2xl",
          newChange || isAvailable === false ? "sticky bottom-0 sm:bottom-6" : false,
        )}
      >
        <Button
          variant="ghost"
          onClick={() => {
            resetProfile();
          }}
          disabled={saving || !newChange}
        >
          Reset identity
        </Button>

        <Button
          onClick={saveProfile}
          disabled={saving || !newChange || isAvailable === false}
        >
          {saving ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
          Save profile
        </Button>
      </div>
    </div>
  );
}
