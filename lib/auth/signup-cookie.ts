/** Short-lived signup details. Not a session, and it holds no password. */
export const SIGNUP_COOKIE = "diary_signup";

const MAX_AGE_SECONDS = 60 * 10;

export function writeSignupCookie(value: string) {
  document.cookie = `${SIGNUP_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearSignupCookie() {
  document.cookie = `${SIGNUP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
