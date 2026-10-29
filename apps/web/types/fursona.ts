export type FursonaCreate = {
  display_name: string;
  username: string;
  species?: string;
  pronouns?: string;
  bio?: string;
};

export type FursonaTypes = {
  id: string;
  display_name: string;
  username: string;
  bio: string | null;
  species: string | null;
  pronouns: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  visibility: ProfileVisibility;
  profile_theme?: "light" | "dark";
  featured_achievements?: ProfileAchievement[];
  social_links?: ProfileSocialLink[];
  show_reputation?: boolean;
  show_events?: boolean;
  show_communities?: boolean;
  last_username_change_at?: Date;
  status: "active" | "deactivated";
  created_at: Date;
  updated_at: Date | null;
};

export type FursonaInput = {
  display_name: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  species?: string;
  pronouns?: string;
  bio?: string;
  updated_at: Date | null;
};

export type FursonaSearch = {
  username: string;
  display_name: string;
  avatar_url?: string;
};

export type FursonaProfile = {
  id: string;
  display_name: string;
  username: string;
  bio: string | null;
  species: string | null;
  pronouns: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  visibility?: ProfileVisibility;
  profile_theme?: "light" | "dark";
  featured_achievements?: ProfileAchievement[];
  social_links?: ProfileSocialLink[];
  show_reputation?: boolean; /* reputation is not hidable */
  show_events?: boolean;
  show_communities?: boolean;
  created_at: Date;
  updated_at: Date | null;
};

// All profiles are discoverable; content access depends on visibility and relationship.
export type ProfileVisibility = "public" | "followers_only" | "private";

export type ProfileSocialPlatform =
  | "website"
  | "bluesky"
  | "discord"
  | "instagram"
  | "telegram"
  | "tiktok"
  | "twitch"
  | "x"
  | "youtube";

export type ProfileSocialLink = {
  platform: ProfileSocialPlatform;
  url: string;
};

export type ProfileAchievement =
  "early_paw" | "community_builder" | "event_explorer" | "trusted_pal";

export type FursonaWithBoolean = FursonaTypes & {
  is_current?: boolean;
  is_default?: boolean;
};

export type FursonaWithAccountId = {
  account_id: string;
} & FursonaProfile;
