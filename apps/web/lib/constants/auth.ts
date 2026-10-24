/**
 * Centralized auth route constants to avoid hardcoded strings
 **/
export const AUTH_ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  SIGNUP_SUCCESS: "/sign-up-success",
  FORGOT_PASSWORD: "/forgot-password",
  UPDATE_PASSWORD: "/new-password",
  CONFIRM: "/confirm",
  TERMS_OF_SERVICE: "#",
  PRIVACY_POLICY: "#",
  SYSTEM_STATUS: "#",
  ERROR: "/error",
  HOME: "/",
  SETTINGS: "/settings",
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
