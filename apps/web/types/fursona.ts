export type FursonaCreateTypes = {
  display_name: string;
  username: string;
  species: string;
  pronouns: string;
  bio: string;
}

export type FursonaTypes = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  species: string | null;
  pronouns: string | null;
  bio: string | null;
  reputation: number;
  created_at: Date;
};

export type FursonaTypesWithId = FursonaTypes & {
  account_id: string;
  is_current: boolean;
  is_default: boolean;
  updated_at: Date;
};

export type FursonaInput = {
  display_name: string;
  username: string;
  avatar_url?: string;
  banner_url?: string;
  species?: string;
  pronouns?: string;
  bio?: string;
};

export type FursonaSearchResult = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  reputation: number;
  is_match_on_display_name: boolean;
};

