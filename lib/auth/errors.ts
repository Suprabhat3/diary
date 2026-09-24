type AuthFailure = {
  message?: string;
  code?: string;
} | null;

export function authErrorMessage(error: AuthFailure, fallback: string): string {
  switch (error?.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with that email already exists.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters.";
    case "PASSWORD_TOO_LONG":
      return "That password is too long.";
    case "INVALID_TOKEN":
      return "This reset link is invalid or has expired.";
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    default:
      return fallback;
  }
}
