import { ROUTE_PREFIX } from "../util/route-util";

export function createDataRequestsRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
    multiLandlord: `${prefix}/multi-landlord`,
  };
}
