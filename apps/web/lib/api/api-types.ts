/**
 * Shared type definitions for API routes.
 * Prevents duplication across multiple route handlers.
 */

export type RouteContext<
  T extends Record<string, string> = Record<string, string>,
> = {
  params: Promise<T>;
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
};
