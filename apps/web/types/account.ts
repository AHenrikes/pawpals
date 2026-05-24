export type AccountTypes = {
  firstname: string;
  lastname: string;
  email: string;
  dob: Date;
  role: string;
};

export type AccountTypesWithID = AccountTypes & {
  id: number;
  user_id: string;
};
