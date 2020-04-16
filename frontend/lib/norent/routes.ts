import { createRoutesForSite, ROUTE_PREFIX } from "../util/route-util";
import { createDevRouteInfo } from "../dev/routes";
import { createLetterStaticPageRouteInfo } from "../static-page/routes";

function createNoRentLetterRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    tenantInfo: `${prefix}/your-info`,
    landlordInfo: `${prefix}/landlord-info`,
  };
}

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The home page. */
    home: `${prefix}/`,

    /** The FAQs page. */
    faqs: `${prefix}/faqs`,

    /** The About page. */
    about: `${prefix}/about`,

    /** The introductory page explaining the letter building process in more detail. */
    aboutLetter: `${prefix}/build-my-letter`,

    /** The actual letter content (HTML and PDF versions). */
    letterContent: createLetterStaticPageRouteInfo(`${prefix}/letter`),

    /** The letter builder. */
    letter: createNoRentLetterRouteInfo(`${prefix}/letter`),
  };
}

export const NorentRoutes = createRoutesForSite(createLocalizedRouteInfo, {
  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: createDevRouteInfo("/dev"),
});
