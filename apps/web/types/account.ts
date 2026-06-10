export type AccountTypes = {
  id: string;
  firstname: string;
  lastname: string;
};

// Client
export type AccountTypesWithRole = AccountTypes & {
  email: string;
  dob: Date;
  account_role: string;
  created_at: Date;
  updated_at: Date;
};

// Server/admin
export type AccountTypeWithId = AccountTypesWithRole & {
  user_id: string;
  is_active: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
};
