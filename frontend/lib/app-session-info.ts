export interface AppSessionInfo {
  /**
   * The phone number of the currently logged-in user, or null if not logged-in.
   */
  phoneNumber: string|null;

  /** The CSRF token; required if a GraphQL client is not provided. */
  csrfToken: string;
}
