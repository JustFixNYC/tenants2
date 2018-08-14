export interface AppRequestInfo {
  /** The URL to render */
  url: string;

  /**
   * The username of the currently logged-in user, or null if not logged-in.
   */
  username: string|null;

  /** The CSRF token; required if a GraphQL client is not provided. */
  csrfToken: string;
}
