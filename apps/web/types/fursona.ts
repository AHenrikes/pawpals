export type FursonaTypes = {
  display_name: string;
  username: string;
  banner_url?: string;
  avatar_url?: string;
  species?: string;
  pronouns?: string;
  bio?: string;
  reputation?: number;
};

export type FursonaTypesWithID = FursonaTypes & {
  id: string;
  account_id: string;
  is_current?: boolean;
  is_default?: boolean;
};
