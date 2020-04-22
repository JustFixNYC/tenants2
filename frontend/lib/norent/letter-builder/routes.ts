import { ROUTE_PREFIX } from "../../util/route-util";
import { createStartAccountOrLoginRouteInfo } from "../start-account-or-login/routes";

export type NorentLetterBuilderRouteInfo = ReturnType<
  typeof createNorentLetterBuilderRouteInfo
>;

export function createNorentLetterBuilderRouteInfo(prefix: string) {
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
    createAccount: `${prefix}/create-account`,
    createAccountTermsModal: `${prefix}/create-account/terms-modal`,
    landlordInfo: `${prefix}/landlord-info`,
    preview: `${prefix}/preview`,
    confirmation: `${prefix}/confirmation`,
  };
}
