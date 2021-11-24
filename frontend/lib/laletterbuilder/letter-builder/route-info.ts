import { createStartAccountOrLoginRouteInfo } from "../../start-account-or-login/route-info";
import { ROUTE_PREFIX } from "../../util/route-util";

export type LALetterBuilderRouteInfo = ReturnType<
  typeof createLALetterBuilderRouteInfo
>;

export function createLALetterBuilderRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    welcome: `${prefix}/welcome`,
    name: `${prefix}/name`,
    ...createStartAccountOrLoginRouteInfo(prefix),
    createAccount: `$prefix/create-account`,
    createAccountTermsModal: `${prefix}/create-account/terms-modal`,
    confirmation: `${prefix}/confirmation`,
  };
}
