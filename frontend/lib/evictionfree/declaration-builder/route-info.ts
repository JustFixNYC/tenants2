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
    crossSiteAgreeToTerms: `${prefix}/terms`,
    name: `${prefix}/name`,
    city: `${prefix}/city`,
    cityConfirmModal: `${prefix}/city/confirm-modal`,
    nationalAddress: `${prefix}/address/national`,
    nationalAddressConfirmModal: `${prefix}/address/national/confirm-modal`,
    nationalAddressConfirmInvalidModal: `${prefix}/address/national/confirm-invalid-modal`,
    nycAddress: `${prefix}/address/nyc`,
    nycAddressConfirmModal: `${prefix}/address/nyc/confirm-address-modal`,
    email: `${prefix}/email`,
    createAccount: `${prefix}/create-account`,
    createAccountTermsModal: `${prefix}/create-account/terms-modal`,
    hardshipSituation: `${prefix}/hardship-situation`,
    indexNumber: `${prefix}/index-number`,
    landlordName: `${prefix}/landlord/name`,
    landlordEmail: `${prefix}/landlord/email`,
    landlordAddress: `${prefix}/landlord/address`,
    landlordAddressConfirmModal: `${prefix}/landlord/address/confirm-modal`,
    preview: `${prefix}/preview`,
    previewSendConfirmModal: `${prefix}/preview/send-confirm-modal`,
    confirmation: `${prefix}/confirmation`,
  };
}
