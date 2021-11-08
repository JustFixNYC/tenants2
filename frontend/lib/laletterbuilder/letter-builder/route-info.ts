import { ROUTE_PREFIX } from "../../util/route-util";
import { createStartAccountOrLoginRouteInfo } from "../../start-account-or-login/route-info";

export type LALetterBuilderRouteInfo = ReturnType<
  typeof createLALetterBuilderRouteInfo
>;

export function createLALetterBuilderRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    welcome: `${prefix}/welcome`,
    ...createStartAccountOrLoginRouteInfo(prefix),
    confirmation: `${prefix}/confirmation`,
  };
}
