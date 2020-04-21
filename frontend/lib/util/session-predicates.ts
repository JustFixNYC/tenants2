import { AllSessionInfo } from "../queries/AllSessionInfo";

/** Returns whether or not a user is currently logged in. */
export function isUserLoggedIn(s: AllSessionInfo): boolean {
  return !!s.phoneNumber;
}
