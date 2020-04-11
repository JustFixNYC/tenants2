/**
 * Note that the typing for this interface isn't the full
 * API that rollbar supports, but it's what we use right now.
 */
declare interface RollbarInterface {
  /**
   * Report an error to Rollbar.
   */
  error(...args: (string | Error)[]): void;
}

interface Window {
  /**
   * Depending on whether Rollbar support is enabled, this
   * object may not exist, so always test for its existence.
   */
  Rollbar?: RollbarInterface;
}
