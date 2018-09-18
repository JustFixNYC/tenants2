/**
 * An "opaque type" for a Google Analytics (GA) tracking ID that
 * ensures we don't confuse a tracking ID with other kinds
 * of strings.
 */
type TrackingID = string & {_: 'Google Analytics Tracking ID'};

/** This is used as a placeholder tracking ID when GA isn't configured. */
export const UNKNOWN_TRACKING_ID = 'UNKNOWN' as TrackingID;

/**
 * The gtag API is provided by Google Analytics:
 * 
 *   https://developers.google.com/gtagjs/reference/api
 * 
 * Here we only define the parts of it that we use.
 */
export interface GoogleTagAPI {
  // https://developers.google.com/analytics/devguides/collection/gtagjs/single-page-applications
  (cmd: 'config', target: TrackingID, info: { page_path: string }): void;
};

declare global {
  interface Window {
    /**
     * A reference to the gtag() global function, provided by gtag.js.
     *
     * However, it won't exist if the app hasn't been configured to support GA.
     */
    gtag: GoogleTagAPI|undefined;

    /**
     * This defines our app's primary tracking ID and is set by
     * a separate script on our page (but it won't be set if GA isn't
     * configured).
     */
    GA_TRACKING_ID: TrackingID|undefined;
  }
}

/** A safe reference to a tracking ID that we can use. */
const GA_TRACKING_ID: TrackingID =
  (typeof(window) !== 'undefined' && window.GA_TRACKING_ID)
  || UNKNOWN_TRACKING_ID;

/** 
 * A safe reference to gtag API we can use. If GA isn't configured,
 * this is essentially a no-op.
 */
export const gtag: GoogleTagAPI = function gtag() {
  if (typeof(window) !== 'undefined' && typeof(window.gtag) === 'function') {
    window.gtag.apply(window, arguments);
  }
};

/* istanbul ignore next */
/**
 * If our environment has set gtag but not a tracking ID, something
 * is amiss. Bail!
 */
if (typeof(window) !== 'undefined' && typeof(window.gtag) === 'function' &&
    GA_TRACKING_ID === UNKNOWN_TRACKING_ID) {
  throw new Error('gtag() exists but GA_TRACKING_ID is not set!');
}

/**
 * Track a virtual page view in our single-page application.
 *
 * @param pathname The new page the user has arrived at.
 */
export function trackPageView(pathname: string) {
  gtag('config', GA_TRACKING_ID, { page_path: pathname });
}
