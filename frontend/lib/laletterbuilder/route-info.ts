import { createDevRouteInfo } from "../dev/route-info";
import { ROUTE_PREFIX, createRoutesForSite } from "../util/route-util";
import { createLaLetterBuilderRouteInfo } from "./letter-builder/route-info";

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The locale prefix, e.g. `/en`. */
    [ROUTE_PREFIX]: prefix,

    /** The home page. */
    home: `${prefix}/`,

    /** The letter builder */
    letter: createLaLetterBuilderRouteInfo(`${prefix}/letter`),

    /** The logout page. */
    logout: `${prefix}/logout`,

    /** The about page. */
    about: `${prefix}/about`,
  };
}

export const LaLetterBuilderRoutes = createRoutesForSite(
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
  LaLetterBuilderRoutes.locale.letter.confirmation,
  ...getLaLetterBuilderRoutesForPrimaryPages(),
];

export const getLaLetterBuilderRoutesForPrimaryPages = () => [
  LaLetterBuilderRoutes.locale.home,
];
