export interface AuthFormValues {
  email: string;
  password: string;
}

export function validateSignIn(values: AuthFormValues) {
  const errors: Partial<Record<keyof AuthFormValues, string>> = {};

  const email = values.email.trim();
  const password = values.password.trim();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}
