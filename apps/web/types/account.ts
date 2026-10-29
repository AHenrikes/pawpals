export type AccountType = {
  id: string;
  user_id: string;
  status: "active" | "at_risk" | "suspended" | "closed";
  platform_role: "user" | "admin";
  default_fursona_id: string;
};

export type PrivateAccountTypes = {
  firstname: string;
  lastname: string;
  email: string;
  dob: Date | null;
  phoneNumber: string | null;
  age_verified_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
} & AccountType;

export type PrivateAccountTypesWithId = {
  account_id: string;
} & PrivateAccountTypes;
