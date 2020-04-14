import { createRoutesForSite, ROUTE_PREFIX } from "../util/route-util";
import { createDevRouteInfo } from "../dev/routes";

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
