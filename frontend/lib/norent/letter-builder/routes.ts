import { ROUTE_PREFIX } from "../../util/route-util";
import { createStartAccountOrLoginRouteInfo } from "../start-account-or-login/routes";

export type NorentLetterBuilderRouteInfo = ReturnType<
  typeof createNorentLetterBuilderRouteInfo
>;

/**
 * This function maps URL paths to our routes within the NoRent Letter Builder flow.
 * To find the actual definition of these routes, check out
 * the `steps.tsx` file in the same directory as this file.
 */
export function createNorentLetterBuilderRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    welcome: `${prefix}/welcome`,
    ...createStartAccountOrLoginRouteInfo(prefix),
    crossSiteAgreeToTerms: `${prefix}/terms`,
    name: `${prefix}/name`,
    city: `${prefix}/city`,
    cityConfirmModal: `${prefix}/city/confirm-modal`,
    knowYourRights: `${prefix}/kyr`,
    nationalAddress: `${prefix}/address/national`,
    nationalAddressConfirmModal: `${prefix}/address/national/confirm-modal`,
    nationalAddressConfirmInvalidModal: `${prefix}/address/national/confirm-invalid-modal`,
    laAddress: `${prefix}/address/los-angeles`,
    nycAddress: `${prefix}/address/nyc`,
    nycAddressConfirmModal: `${prefix}/address/nyc/confirm-address-modal`,
    email: `${prefix}/email`,
    createAccount: `${prefix}/create-account`,
    createAccountTermsModal: `${prefix}/create-account/terms-modal`,
    postSignupNoProtections: `${prefix}/post-signup-no-protections`,
    landlordName: `${prefix}/landlord/name`,
    landlordEmail: `${prefix}/landlord/email`,
    landlordAddress: `${prefix}/landlord/address`,
    landlordAddressConfirmModal: `${prefix}/landlord/address/confirm-modal`,
    preview: `${prefix}/preview`,
    previewSendConfirmModal: `${prefix}/preview/send-confirm-modal`,
    confirmation: `${prefix}/confirmation`,
  };
}
