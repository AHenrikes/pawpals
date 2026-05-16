export type AccountTypes = {
  firstname: string,
  lastname: string,
  email: string,
  dob: Date
}

export type AccountTypesWithID = AccountTypes & {
  id: number,
  user_id: string
}
