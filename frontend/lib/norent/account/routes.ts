import { ROUTE_PREFIX } from "../../util/route-util";
import { createStartAccountOrLoginRouteInfo } from "../start-account-or-login/routes";

export type NorentAccountRouteInfo = ReturnType<
  typeof createNorentAccountRouteInfo
>;

export function createNorentAccountRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    welcome: `${prefix}/welcome`,
    ...createStartAccountOrLoginRouteInfo(prefix),
    name: `${prefix}/name`,
    city: `${prefix}/city`,
    nationalAddress: `${prefix}/address/national`,
    nycAddress: `${prefix}/address/nyc`,
    nycAddressConfirmModal: `${prefix}/address/nyc/confirm-address-modal`,
    email: `${prefix}/email`,
    create: `${prefix}/create`,
    update: `${prefix}/update`,
  };
}
