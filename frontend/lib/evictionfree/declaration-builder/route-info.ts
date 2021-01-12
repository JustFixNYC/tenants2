import { ROUTE_PREFIX } from "../../util/route-util";
import { createStartAccountOrLoginRouteInfo } from "../../start-account-or-login/route-info";

export type EvictionFreeDeclarationBuilderRouteInfo = ReturnType<
  typeof createEvictionFreeDeclarationBuilderRouteInfo
>;

export function createEvictionFreeDeclarationBuilderRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    welcome: `${prefix}/welcome`,
    ...createStartAccountOrLoginRouteInfo(prefix),
    confirmation: `${prefix}/confirmation`,
  };
}
