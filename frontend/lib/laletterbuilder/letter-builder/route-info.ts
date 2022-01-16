import { createStartAccountOrLoginRouteInfo } from "../../start-account-or-login/route-info";
import { ROUTE_PREFIX } from "../../util/route-util";

export type LaLetterBuilderRouteInfo = ReturnType<
  typeof createLaLetterBuilderRouteInfo
>;

export function createLaLetterBuilderRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    welcome: `${prefix}/welcome`,
    ...createStartAccountOrLoginRouteInfo(prefix),
    name: `${prefix}/name`,
    city: `${prefix}/city`,
    cityConfirmModal: `${prefix}/city/confirm-modal`,
    nationalAddress: `${prefix}/address/national`,
    nationalAddressConfirmModal: `${prefix}/address/national/confirm-modal`,
    nationalAddressConfirmInvalidModal: `${prefix}/address/national/confirm-invalid-modal`,
    createAccount: `${prefix}/create-account`,
    createAccountTermsModal: `${prefix}/create-account/terms-modal`,
    chooseLetter: `${prefix}/choose-letter`,
    landlordName: `${prefix}/landlord/name`,
    landlordEmail: `${prefix}/landlord/email`,
    landlordAddress: `${prefix}/landlord/address`,
    landlordAddressConfirmModal: `${prefix}/landlord/address/confirm-modal`,
    confirmation: `${prefix}/confirmation`,
  };
}
