/**
 * Centralized error messages for consistent error handling across the app
 */
export const ERROR_MESSAGES = {
  // Form validation
  DISPLAY_NAME_REQUIRED: "Display name is required",
  USERNAME_REQUIRED: "Username is required",
  BIO_REQUIRED: "Bio is required",
  SPECIES_REQUIRED: "Species is required",
  PRONOUNS_REQUIRED: "Pronouns are required",
  WEAK_PASSWORD: "Password should be at least 6 characters",

  // Search
  SEARCH_INVALID_INPUT: "Enter a username to search",
  SEARCH_USER_NOT_FOUND: "User not found",
  SEARCH_NO_RESULTS: "No results found",

  // Profile/Account
  ACCOUNT_NOT_FOUND: "Could not find account.",
  ACCOUNT_NOT_LOADED: "Account not loaded - cannot upload",
  PROFILE_UPDATE_FAILED: "Failed to update profile",
  PROFILE_LOAD_FAILED: "Failed to load profile",

  // Social actions
  FOLLOW_FAILED: "Failed to follow user",
  UNFOLLOW_FAILED: "Failed to unfollow user",
  LIKE_FAILED: "Failed to like fursona",
  UNLIKE_FAILED: "Failed to unlike fursona",

  // Fursona management
  FURSONA_NOT_IDENTIFIED: "Failed to identify fursona",
  FURSONA_NOT_FOUND: "Failed to find fursona.",
  FURSONAS_NOT_FOUND: "Failed to find fursonas.",
  FURSONA_NAME_REQUIRED: "Fursona name required.",
  FURSONA_USERNAME_REQUIRED: "Fursona username required.",
  FURSONA_NAME_TOO_LONG: "The display name is too long",
  FURSONA_CREATE_FAILED: "Failed to create fursona",
  FURSONA_UPDATE_FAILED: "Failed to update fursona",
  FURSONA_USERNAME_FORMAT:
    "Invalid username format: 3-50 characters, alphanumeric/underscore/hyphen only.",
  FURSONA_DELETE_FAILED: "Failed to delete fursona",
  FURSONA_SWITCH_FAILED: "Failed to switch fursona",
  MAX_FURSONAS_REACHED: "Maximum number of fursonas reached",

  // Post
  POST_NOT_FOUND: "Failed to fetch post",
  POST_ERROR: "Failed to post content",
  INVALID_POST_TYPE: "Invalid post type",
  INVALID_VISIBILITY_TYPE: "Invalid visibility type",
  MEDIA_REQUIRED: "Atleest one media is required",

  // Upload
  UPLOAD_FAILED: "Upload failed",
  INVALID_FILE_TYPE: "Invalid file type",
  FILE_TOO_LARGE: "File is too large",

  // Server errors
  SERVER_ERROR: "Server error occurred. Please try again later.",
  NETWORK_ERROR: "Network error occurred. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access forbidden.",
  NOT_FOUND: "Resource not found.",

  // General
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again later.",
} as const;
