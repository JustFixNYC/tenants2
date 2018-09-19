/**
 * The analytics.js API is provided by Google Analytics:
 * 
 *   https://developers.google.com/analytics/devguides/collection/analyticsjs/
 * 
 * Here we only define the parts of it that we use.
 */
export interface GoogleAnalyticsAPI {
  // https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
  (cmd: 'set', fieldName: 'page', fieldValue: string): void;
  (cmd: 'send', hitType: 'pageview'): void;
};

declare global {
  interface Window {
    /**
     * A reference to the ga() global function, provided by analytics.js.
     *
     * However, it won't exist if the app hasn't been configured to support GA.
     */
    ga: GoogleAnalyticsAPI|undefined;
  }
}

/** 
 * A safe reference to a GA API we can use. If GA isn't configured,
 * this is essentially a no-op.
 */
export const ga: GoogleAnalyticsAPI = function ga() {
  if (typeof(window) !== 'undefined' && typeof(window.ga) === 'function') {
    window.ga.apply(window, arguments);
  }
};

/**
 * Track a virtual page view in our single-page application.
 *
 * @param pathname The new page the user has arrived at.
 */
export function trackPageView(pathname: string) {
  ga('set', 'page', pathname);
  ga('send', 'pageview');
}
