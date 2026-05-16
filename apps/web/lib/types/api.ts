/**
 * Shared type definitions for API routes.
 * Prevents duplication across multiple route handlers.
 */

export type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
};
