/**
 * Note that the typing for this interface isn't the full
 * API that rollbar supports, but it's what we use right now.
 */
declare interface RollbarInterface {
  /**
   * Report an error to Rollbar.
   */
  error(...args: (string | Error)[]): void;

  /**
   * Configure Rollbar.
   */
  configure(options: {
    // https://docs.rollbar.com/docs/rollbarjs-configuration-reference
    payload?: {
      /**
       * An object identifying the logged-in user.
       */
      person?: {
        /**
         * The user id of the currently logged-in user, or `null` if
         * logged out.
         *
         * Note that Rollbar documentation is inconsistent about the
         * exact type of this variable.
         */
        id: number | null;
      };
    };
  }): void;
}

interface Window {
  /**
   * Depending on whether Rollbar support is enabled, this
   * object may not exist, so always test for its existence.
   */
  Rollbar?: RollbarInterface;
}
