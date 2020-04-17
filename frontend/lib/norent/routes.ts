import { createRoutesForSite, ROUTE_PREFIX } from "../util/route-util";
import { createDevRouteInfo } from "../dev/routes";
import { createLetterStaticPageRouteInfo } from "../static-page/routes";

function createNoRentLetterRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    tenantInfo: `${prefix}/your-info`,
    landlordInfo: `${prefix}/landlord-info`,
    preview: `${prefix}/preview`,
  };
}

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The home page. */
    home: `${prefix}/`,

    /** The FAQs page. */
    faqs: `${prefix}/faqs`,

    /** The Information page. */
    info: `${prefix}/info`,

    /** The "About Your Letter" page explaining the letter building process in more detail. */
    aboutLetter: `${prefix}/about-your-letter`,

    /** The letter content for the user's own data (HTML and PDF versions). */
    letterContent: createLetterStaticPageRouteInfo(`${prefix}/letter`),

    /** The sample letter content (HTML and PDF versions). */
    sampleLetterContent: createLetterStaticPageRouteInfo(
      `${prefix}/sample-letter`
    ),

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
