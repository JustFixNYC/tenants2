/**
 * This API is provided by Facebook:
 *
 *   https://developers.facebook.com/docs/marketing-api/audiences-api/pixel
 *
 * Here we only define the parts of it that we use.
 */
export interface FacebookPixelAPI {
  /**
   * Track a custom event indicating that the user has completed our
   * onboarding process and signed up for an account.
   */
  (cmd: "trackCustom", event: "NewUserSignup"): void;

  /**
   * Track a custom event indicating that the user has performed
   * a Data-Driven Onboarding (DDO) search.
   */
  (cmd: "trackCustom", event: "DDOSearch"): void;

  /**
   * Track a custom event indicating that the user has sent a
   * habitability letter from the LA Tenant Action Center
   */
  (cmd: "trackCustom", event: "LaHabitabilityLetterSent"): void;
}

declare global {
  interface Window {
    /**
     * A reference to the fbq() global function, provided by the
     * Facebook Pixel snippet.
     *
     * However, it won't exist if the app hasn't been configured to
     * support Facebook Pixel.
     */
    fbq: FacebookPixelAPI | undefined;
  }
}

/**
 * A safe reference to a Facebook Pixel API we can use. If Facebook Pixel
 * isn't configured, this is largely a no-op.
 */
export const fbq: FacebookPixelAPI = function fbq() {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq.apply(window, arguments as any);
  }
};
