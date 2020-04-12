import { createRoutesForSite } from "../util/route-util";

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The home page. */
    home: `${prefix}/`,
  };
}

export const NorentRoutes = createRoutesForSite(createLocalizedRouteInfo, {});
