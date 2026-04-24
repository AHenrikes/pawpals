export type FursonaDraft = {
  name: string,
  username: string,
  species?: string,
  pronouns?: string,
  bio?: string,
  is_default: boolean
}

export type FursonaRecord = FursonaDraft & {
  id: string | number
}
