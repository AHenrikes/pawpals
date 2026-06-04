export type AccountTypes = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  dob: Date;
};

export type AccountTypesWithRole = AccountTypes & {
  role: string;
};

export type AccountTypeWithId = AccountTypesWithRole & {
  user_id: string;
};
