import { ROUTE_PREFIX } from "../util/route-util";

export function createAccountSettingsRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
    name: `${prefix}/name`,
  };
}

export type AccountSettingsRouteInfo = ReturnType<
  typeof createAccountSettingsRouteInfo
>;
