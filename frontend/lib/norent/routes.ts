import { createRoutesForSite } from "../util/route-util";
import { createDevRouteInfo } from "../dev/routes";
import { createLetterStaticPageRouteInfo } from "../static-page/routes";
import { createNorentLetterBuilderRouteInfo } from "./letter-builder/routes";

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The home page. */
    home: `${prefix}/`,

    /** The FAQs page. */
    faqs: `${prefix}/faqs`,

    /** The About page. */
    about: `${prefix}/about`,

    /** The "About Your Letter" page explaining the letter building process in more detail. */
    aboutLetter: `${prefix}/the-letter`,

    /** The letter content for the user's own data (HTML and PDF versions). */
    letterContent: createLetterStaticPageRouteInfo(`${prefix}/letter`),

    /** The email to the user's landlord. */
    letterEmail: `${prefix}/letter-email.txt`,

    /** The sample letter content (HTML and PDF versions). */
    sampleLetterContent: createLetterStaticPageRouteInfo(
      `${prefix}/sample-letter`
    ),

    /** The letter builder. */
    letter: createNorentLetterBuilderRouteInfo(`${prefix}/letter`),
  };
}

export const NorentRoutes = createRoutesForSite(createLocalizedRouteInfo, {
  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: createDevRouteInfo("/dev"),
});
