import { createRoutesForSite, ROUTE_PREFIX } from "../util/route-util";
import { createDevRouteInfo } from "../dev/route-info";
import {
  createHtmlEmailStaticPageRouteInfo,
  createLetterStaticPageRouteInfo,
} from "../static-page/routes";
import { createNorentLetterBuilderRouteInfo } from "./letter-builder/route-info";

/**
 * This function maps URL paths to our main routes on the NoRent site.
 * To find the actual definition of these routes, check out
 * the `routes.tsx` file in the same directory as this file.
 */
function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The locale prefix, e.g. `/en`. */
    [ROUTE_PREFIX]: prefix,

    /** The home page. */
    home: `${prefix}/`,

    /** The FAQs page. */
    faqs: `${prefix}/faqs`,

    /** The About page. */
    about: `${prefix}/about`,

    /** The "About Your Letter" page explaining the letter building process in more detail. */
    aboutLetter: `${prefix}/the-letter`,

    /** The Logout page */
    logout: `${prefix}/logout`,

    /** The letter content for the user's own data (HTML and PDF versions). */
    letterContent: createLetterStaticPageRouteInfo(`${prefix}/letter`),

    /** The email to the user's landlord. */
    letterEmail: `${prefix}/letter-email.txt`,

    /** The email to the user w/ a copy of the letter. */
    letterEmailToUser: createHtmlEmailStaticPageRouteInfo(
      `${prefix}/letter-email-to-user`
    ),

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

export const getNorentJumpToTopOfPageRoutes = () => [
  NorentRoutes.locale.letter.confirmation,
  ...getNorentRoutesForPrimaryPages(),
];

export const getNorentRoutesForPrimaryPages = () => [
  NorentRoutes.locale.home,
  NorentRoutes.locale.about,
  NorentRoutes.locale.faqs,
  NorentRoutes.locale.aboutLetter,
];
