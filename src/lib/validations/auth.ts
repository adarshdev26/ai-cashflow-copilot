export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

/** Returns an error message, or null when the password is valid. */
export function validatePassword(password: unknown, minLength = PASSWORD_MIN): string | null {
  if (typeof password !== 'string' || password.length === 0) return 'Password is required';
  if (password.length < minLength) return `Password must be at least ${minLength} characters`;
  if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters`;
  return null;
}

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
