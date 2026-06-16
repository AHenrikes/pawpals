export type FursonaCreate = {
  display_name: string;
  username: string;
  species?: string;
  pronouns?: string;
  bio?: string;
}

export type FursonaTypes = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  species?: string;
  pronouns?: string;
  bio?: string;
  reputation: number;
  created_at: Date;
  updated_at: Date;
};

export type FursonaInput = {
  display_name: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  species?: string;
  pronouns?: string;
  bio?: string;
  updated_at: Date;
}

export type FursonaSearch = {
  username: string;
  display_name: string;
  avatar_url?: string;
  reputation: number;
};

export type FursonaProfile = {
  display_name: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  species?: string;
  pronouns?: string;
  bio?: string;
  reputation: number;
  created_at: Date;
}

export type FursonaWithBoolean = FursonaTypes & {
  is_current: boolean;
  is_default: boolean;
};

export type FursonaWithAccountId = FursonaWithBoolean & {
  account_id: string;
}
