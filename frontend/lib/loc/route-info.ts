import { createJustfixCrossSiteVisitorRoutes } from "../justfix-cross-site-visitor-route-info";
import { createLetterStaticPageRouteInfo } from "../static-page/routes";
import { ROUTE_PREFIX } from "../util/route-util";
import { createIssuesRouteInfo } from "../issues/route-info";
import { createStartAccountOrLoginRouteInfo } from "../start-account-or-login/route-info";

export type LetterOfComplaintInfo = ReturnType<
  typeof createLetterOfComplaintRouteInfo
>;

export function createLetterOfComplaintRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    /** The sample letter content (HTML and PDF versions). */
    sampleLetterContent: createLetterStaticPageRouteInfo(
      `${prefix}/sample-letter`
    ),
    /** Letter content for the user (HTML and PDF versions). */
    letterContent: createLetterStaticPageRouteInfo(`${prefix}/letter`),
    splash: `${prefix}/splash`,
    name: `${prefix}/name`,
    nycAddress: `${prefix}/address/nyc`,
    nycAddressConfirmModal: `${prefix}/address/nyc/confirm-address-modal`,
    leaseType: `${prefix}/lease-type`,
    email: `${prefix}/email`,
    createAccount: `${prefix}/create-account`,
    createAccountTermsModal: `${prefix}/create-account/terms-modal`,
    ...createStartAccountOrLoginRouteInfo(prefix),
    welcome: `${prefix}/welcome`,
    ...createJustfixCrossSiteVisitorRoutes(prefix),
    issues: createIssuesRouteInfo(`${prefix}/issues`),
    accessDates: `${prefix}/access-dates`,
    reliefAttempts: `${prefix}/relief-attempts`,
    yourLandlord: `${prefix}/your-landlord`,
    preview: `${prefix}/preview`,
    previewSendConfirmModal: `${prefix}/preview/send-confirm-modal`,
    confirmation: `${prefix}/confirmation`,
  };
}
