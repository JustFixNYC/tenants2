import { createDevRouteInfo } from "../dev/route-info";
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

    /** The logout page. */
    logout: `${prefix}/logout`,

    /** The about page. */
    about: `${prefix}/about`,
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
