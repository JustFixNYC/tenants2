import { createRoutesForSite, ROUTE_PREFIX } from "../util/route-util";
import { createDevRouteInfo } from "../dev/route-info";
import { createLALetterBuilderRouteInfo } from "./letter-builder/route-info";

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The locale prefix, e.g. `/en`. */
    [ROUTE_PREFIX]: prefix,

    /** The home page. */
    home: `${prefix}/`,

    /** The letter builder */
    letter: createLALetterBuilderRouteInfo(`${prefix}/letter`),

    /** The logout page. */
    logout: `${prefix}/logout`,

    /** The about page. */
    about: `${prefix}/about`,
  };
}

export const LALetterBuilderRoutes = createRoutesForSite(
  createLocalizedRouteInfo,
  {
    /**
     * Example pages used in integration tests, and other
     * development-related pages.
     */
    dev: createDevRouteInfo("/dev"),
  }
);
