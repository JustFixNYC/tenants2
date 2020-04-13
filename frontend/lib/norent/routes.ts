import { createRoutesForSite } from "../util/route-util";
import { createDevRouteInfo } from "../dev/routes";

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The home page. */
    home: `${prefix}/`,

    /** Ask for tenant info. */
    tenantInfo: `${prefix}/your-info`,

    /** Ask for landlord info. */
    landlordInfo: `${prefix}/landlord-info`,
  };
}

export const NorentRoutes = createRoutesForSite(createLocalizedRouteInfo, {
  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: createDevRouteInfo("/dev"),
});
