export const settingsGroups = [
  {
    label: "User settings",
    items: [
      { id: "account", label: "My account" },
      { id: "profile", label: "Profiles & socials" },
      { id: "privacy", label: "Privacy & safety" },
    ],
  },
  {
    label: "App settings",
    items: [
      { id: "notifications", label: "Notifications" },
      { id: "appearance", label: "Appearance" },
    ],
  },
] as const;

export type SettingsSectionId =
  (typeof settingsGroups)[number]["items"][number]["id"];

const sectionLabels: Record<SettingsSectionId, string> = {
  account: "My account",
  profile: "Profiles & socials",
  privacy: "Privacy & safety",
  notifications: "Notifications",
  appearance: "Appearance",
};

export const settingsSearchItems: {
  section: SettingsSectionId;
  title: string;
  anchor: string;
  keywords?: string;
}[] = [
  {
    section: "account",
    title: "Account information",
    anchor: "account-information",
    keywords: "name email phone date of birth",
  },
  {
    section: "account",
    title: "Password & security",
    anchor: "password-security",
    keywords: "password multi-factor authentication",
  },
  {
    section: "account",
    title: "Account status",
    anchor: "account-status",
    keywords: "membership verification",
  },
  {
    section: "account",
    title: "Danger zone",
    anchor: "danger-zone",
    keywords: "disable delete account",
  },
  {
    section: "profile",
    title: "Profile information",
    anchor: "profile-information",
    keywords: "display name username bio species pronouns",
  },
  {
    section: "profile",
    title: "Socials",
    anchor: "profile-socials",
    keywords: "social links instagram tiktok telegram discord twitter x",
  },
  {
    section: "profile",
    title: "Profile theme",
    anchor: "profile-theme",
    keywords: "sync match app light dark",
  },
  {
    section: "profile",
    title: "Profile sections",
    anchor: "profile-sections",
    keywords: "events communities",
  },
  {
    section: "profile",
    title: "Featured achievements",
    anchor: "featured-achievements",
  },
  {
    section: "privacy",
    title: "Post visibility",
    anchor: "post-visibility",
    keywords: "private public followers subscribers who can see posts",
  },
  {
    section: "notifications",
    title: "Follow request alerts",
    anchor: "follow-request-alerts",
    keywords: "badge bell",
  },
  {
    section: "appearance",
    title: "Theme",
    anchor: "app-theme",
    keywords: "light dark system sync profile",
  },
  {
    section: "appearance",
    title: "Animations",
    anchor: "animations",
    keywords: "motion reduced",
  },
  {
    section: "appearance",
    title: "Text size",
    anchor: "text-size",
    keywords: "larger accessibility",
  },
];

export function settingsSectionLabel(section: SettingsSectionId) {
  return sectionLabels[section];
}

export function searchSettings(query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return settingsSearchItems.filter((item) => {
    const text =
      `${settingsSectionLabel(item.section)} ${item.title} ${item.keywords ?? ""}`.toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
}
