/**
 * Centralized auth route constants to avoid hardcoded strings
**/
export const AUTH_ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  SIGNUP_SUCCESS: "/sign-up-success",
  FORGOT_PASSWORD: "/forgot-password",
  UPDATE_PASSWORD: "/new-password",
  SETTINGS: "/settings",
  CONFIRM: "/confirm",
  TERMS_OF_SERVICE: "#",
  PRIVACY_POLICY: "#",
  SYSTEM_STATUS: "#",
  PAWPAL_MEET: "/pawpal-meet",
  COMMUNITY: "/community",
  NOTIFICATION: "/notifications",
  INBOX: "/inbox",
  ABOUT: "/about",
  STORE: "/store",
  ERROR: "/error",
  HOME: "/",
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
