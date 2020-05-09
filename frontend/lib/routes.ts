import { DevRouteInfo } from "./dev/routes";
import { RouteInfo } from "./util/route-util";
import { getGlobalAppServerInfo, AppServerInfo } from "./app-context";
import { default as JustfixRoutes } from "./justfix-routes";
import { NorentRoutes } from "./norent/routes";

/** Common localized routes all our sites support. */
type CommonLocalizedSiteRoutes = {
  /** The site home page. */
  home: string;
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
