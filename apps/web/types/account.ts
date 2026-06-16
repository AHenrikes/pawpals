export type AccountTypes = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  dob: Date;
  created_at: Date;
  updated_at: Date;
};

export type AccountWithRole = AccountTypes & {
  account_role: string;
};

export type AccountTypeWithId = AccountWithRole & {
  user_id: string;
  is_active: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
};
