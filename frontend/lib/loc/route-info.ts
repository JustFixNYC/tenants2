import { createJustfixCrossSiteVisitorRoutes } from "../justfix-cross-site-visitor-route-info";
import { createLetterStaticPageRouteInfo } from "../static-page/routes";
import { ROUTE_PREFIX } from "../util/route-util";
import { createIssuesRouteInfo } from "../issues/route-info";

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
    welcome: `${prefix}/welcome`,
    ...createJustfixCrossSiteVisitorRoutes(prefix),
    issues: createIssuesRouteInfo(`${prefix}/issues`),
    accessDates: `${prefix}/access-dates`,
    reliefAttempts: `${prefix}/relief-attempts`,
    workOrders: `${prefix}/work-orders`,
    yourLandlord: `${prefix}/your-landlord`,
    preview: `${prefix}/preview`,
    previewSendConfirmModal: `${prefix}/preview/send-confirm-modal`,
    confirmation: `${prefix}/confirmation`,
  };
}
