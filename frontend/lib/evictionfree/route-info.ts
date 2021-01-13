import { createRoutesForSite, ROUTE_PREFIX } from "../util/route-util";
import { createDevRouteInfo } from "../dev/route-info";
import { createEvictionFreeDeclarationBuilderRouteInfo } from "./declaration-builder/route-info";

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The locale prefix, e.g. `/en`. */
    [ROUTE_PREFIX]: prefix,

    /** The home page. */
    home: `${prefix}/`,

    /** The declaration builder. */
    declaration: createEvictionFreeDeclarationBuilderRouteInfo(
      `${prefix}/declaration`
    ),

    /** The logout page. */
    logout: `${prefix}/logout`,
  };
}

export const EvictionFreeRoutes = createRoutesForSite(
  createLocalizedRouteInfo,
  {
    /**
     * Example pages used in integration tests, and other
     * development-related pages.
     */
    dev: createDevRouteInfo("/dev"),
  }
);

export const getEvictionFreeJumpToTopOfPageRoutes = () => [
  EvictionFreeRoutes.locale.declaration.confirmation,
  ...getEvictionFreeRoutesForPrimaryPages(),
];

export const getEvictionFreeRoutesForPrimaryPages = () => [
  EvictionFreeRoutes.locale.home,
];
