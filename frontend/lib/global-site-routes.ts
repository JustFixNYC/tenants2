import { DevRouteInfo } from "./dev/route-info";
import { RouteInfo, ROUTE_PREFIX } from "./util/route-util";
import { getGlobalAppServerInfo, AppServerInfo } from "./app-context";
import { default as JustfixRoutes } from "./justfix-routes";
import { NorentRoutes } from "./norent/route-info";
import History from "history";

/** Common localized routes all our sites support. */
type CommonLocalizedSiteRoutes = {
  /** The locale prefix. */
  [ROUTE_PREFIX]: string;

  /** The site home page. */
  home: string;

  /** Create a link to the login page, if the site has one. */
  createLoginLink?: (next: History.Location) => string;
};

/** Common non-localized routes all our sites support. */
type CommonNonLocalizedSiteRoutes = {
  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: DevRouteInfo;
};

export type SiteRoutes = RouteInfo<
  CommonLocalizedSiteRoutes,
  CommonNonLocalizedSiteRoutes
>;

/**
 * Return the routes for the currently active site.
 *
 * Note that only routes common to all our sites will be
 * accessible through this object.
 */
export function getGlobalSiteRoutes(
  serverInfo: AppServerInfo = getGlobalAppServerInfo()
): SiteRoutes {
  switch (serverInfo.siteType) {
    case "JUSTFIX":
      return JustfixRoutes;
    case "NORENT":
      return NorentRoutes;
  }
}
