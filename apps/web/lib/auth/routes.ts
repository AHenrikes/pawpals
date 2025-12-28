/**
 * Centralized auth route constants to avoid hardcoded strings
**/
export const AUTH_ROUTES = {
  SIGNIN: "/sign-in",
  SIGNUP: "/sign-up",
  SIGNUP_SUCCESS: "/sign-up-success",
  FORGOT_PASSWORD: "/forgot-password",
  UPDATE_PASSWORD: "/new-password",
  ERROR: "/error",
  CONFIRM: "/confirm",
  DASHBOARD: "/dashboard",
  HOME: "/",
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
