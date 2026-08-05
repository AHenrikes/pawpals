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
  PAWPALS_MEET: "/pawpals-meet",
  COMMUNITY: "/community",
  NOTIFICATION: "/notifications",
  MESSAGES: "/messages",
  REELS: "/reels",
  ABOUT: "/about",
  STORE: "/store",
  ERROR: "/error",
  HELP: "/help",
  HOME: "/",
  PUBLIC_HOME: "/home",
  CONTACT_US: "/contact-us",
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
