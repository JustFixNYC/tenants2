import { createStartAccountOrLoginRouteInfo } from "../../../start-account-or-login/route-info";
import { ROUTE_PREFIX } from "../../../util/route-util";
import { createIssuesRouteInfo } from "../../../issues/route-info";
import {
  createLetterStaticPageRouteInfo,
  createHtmlEmailStaticPageRouteInfo,
} from "../../../static-page/routes";

export type HabitabilityRouteInfo = ReturnType<
  typeof createHabitabilityRouteInfo
>;

export function createHabitabilityRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    ...createStartAccountOrLoginRouteInfo(prefix),
    welcome: `${prefix}/welcome`,
    name: `${prefix}/name`,
    nycAddress: `${prefix}/nyc-address`,
    nycAddressConfirmModal: `${prefix}/nyc-address/confirm-modal`,
    createAccount: `${prefix}/create-account`,
    createAccountTermsModal: `${prefix}/create-account/terms-modal`,
    myLetters: `${prefix}/my-letters`,
    landlordInfo: `${prefix}/landlord/info`,
    landlordAddressConfirmModal: `${prefix}/landlord/info/confirm-modal`,
    issues: createIssuesRouteInfo(`${prefix}/issues`),
    overcharge: `${prefix}/overcharge`,
    accessDates: `${prefix}/access-dates`,
    preview: `${prefix}/preview`,
    sending: `${prefix}/sending`,
    sendConfirmModal: `${prefix}/sending/confirm-modal`,
    confirmation: `${prefix}/confirmation`,

    /** The letter content for the user's own data (HTML and PDF versions). */
    letterContent: createLetterStaticPageRouteInfo(`${prefix}/letter`),

    /** The email to the user's landlord. */
    letterEmail: `${prefix}/letter-email.txt`,

    /** The email to the user w/ a copy of the letter. */
    letterEmailToUser: createHtmlEmailStaticPageRouteInfo(
      `${prefix}/letter-email-to-user`
    ),

    /** The sample letter content (HTML and PDF versions). */
    sampleLetterContent: createLetterStaticPageRouteInfo(
      `${prefix}/sample-letter`
    ),
  };
}
