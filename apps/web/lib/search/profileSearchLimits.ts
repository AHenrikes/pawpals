export const PROFILE_SEARCH_MIN_LENGTH = 3;
export const PROFILE_SEARCH_MAX_LENGTH = 50;

export function isValidProfileSearchTerm(term: string): boolean {
  const length = term.trim().length;
  return (
    length >= PROFILE_SEARCH_MIN_LENGTH && length <= PROFILE_SEARCH_MAX_LENGTH
  );
}
