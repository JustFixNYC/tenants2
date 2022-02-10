import { createDevRouteInfo } from "../dev/route-info";
import {
  createHtmlEmailStaticPageRouteInfo,
  createLetterStaticPageRouteInfo,
} from "../static-page/routes";
import { ROUTE_PREFIX, createRoutesForSite } from "../util/route-util";
import { createHabitabilityRouteInfo } from "./letter-builder/habitability/route-info";

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The locale prefix, e.g. `/en`. */
    [ROUTE_PREFIX]: prefix,

    /** The home page. */
    home: `${prefix}/`,

    chooseLetter: `${prefix}/choose-letter`,

    /** Habitability Letter flow */
    habitability: createHabitabilityRouteInfo(`${prefix}/habitability`),

    /** The letter content for the user's own data (HTML and PDF versions). */
    letterContent: createLetterStaticPageRouteInfo(`${prefix}/letter`),

    /** The logout page. */
    logout: `${prefix}/logout`,

    /** The about page. */
    about: `${prefix}/about`,

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
  };
}

export const LaLetterBuilderRouteInfo = createRoutesForSite(
  createLocalizedRouteInfo,
  {
    /**
     * Example pages used in integration tests, and other
     * development-related pages.
     */
    dev: createDevRouteInfo("/dev"),
  }
);

export const getLaLetterBuilderJumpToTopOfPageRoutes = () => [
  LaLetterBuilderRouteInfo.locale.habitability.confirmation, // add a ref to all confirmation pages for all 4 letters
  ...getLaLetterBuilderRoutesForPrimaryPages(),
];

export const getLaLetterBuilderRoutesForPrimaryPages = () => [
  LaLetterBuilderRouteInfo.locale.home,
];
