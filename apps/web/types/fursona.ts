export type FursonaTypes = {
  display_name: string;
  username: string;
  banner_url?: string;
  avatar_url?: string;
  species?: string;
  pronouns?: string;
  bio?: string;
  reputation?: number;
  is_current?: boolean;
  is_default?: boolean;
};

export type FursonaTypesWithID = FursonaTypes & {
  id: number;
  account_id: number;
};
