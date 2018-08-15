export interface AppServerInfo {
  /**
   * The URL of the server's static files, e.g. "/static/".
   */
  staticURL: string;

  /**
   * The URL to generated webpack bundles for lazy-loading, e.g. "/static/frontend/".
   */
  webpackPublicPathURL: string;

  /**
   * The URL of the server's Django admin, e.g. "/admin/".
   */
  adminIndexURL: string;

  /** The batch GraphQL endpoint; required if a GraphQL client is not provided. */
  batchGraphQLURL: string;

  /**
   * Whether the site is in development mode (corresponds to settings.DEBUG in
   * the Django app).
   */
  debug: boolean;
}
