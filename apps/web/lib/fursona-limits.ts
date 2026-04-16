export const FURSONA_LIMITS = {
  free: 4,
  subscribed: 6,
} as const;

export type PlanTier = keyof typeof FURSONA_LIMITS;

export function getFursonaLimit(planTier: PlanTier) {
  return FURSONA_LIMITS[planTier];
}
