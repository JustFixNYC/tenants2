import { ROUTE_PREFIX } from "../util/route-util";

export type PasswordResetRouteInfo = ReturnType<
  typeof createPasswordResetRouteInfo
>;

export function createPasswordResetRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    start: `${prefix}/start`,
    verify: `${prefix}/verify`,
    confirm: `${prefix}/confirm`,
    done: `${prefix}/done`,
  };
}
