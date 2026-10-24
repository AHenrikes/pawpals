export type AccountType = {
  id: string;
  user_id: string;
  status: "active" | "suspended" | "closed";
  platform_role: "user" | "admin";
  default_fursona_id: string;
}

export type PrivateAccountTypes = {
  account_id: string;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string | null;
  dob: Date | null;
  created_at: Date;
  updated_at: Date;
} & AccountType;
