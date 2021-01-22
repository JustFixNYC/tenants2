import { AllSessionInfo } from "../queries/AllSessionInfo";

/** Returns whether or not a user is currently logged in. */
export function isUserLoggedIn(s: AllSessionInfo): boolean {
  return !!s.phoneNumber;
}

/** Returns whether or not a user is currently logged out. */
export function isUserLoggedOut(s: AllSessionInfo): boolean {
  return !s.phoneNumber;
}

/**
 * Returns whether a user is logged in, but doesn't an email address set.
 */
export function isUserLoggedInWithEmail(s: AllSessionInfo): boolean {
  return isUserLoggedIn(s) && !!s.email;
}
