import { createJustfixCrossSiteVisitorRoutes } from "../../justfix-cross-site-visitor-route-info";
import { createOnboardingRouteInfo } from "../../onboarding/route-info";
import { createHtmlEmailStaticPageRouteInfo } from "../../static-page/routes";
import { ROUTE_PREFIX } from "../../util/route-util";

export function createEmergencyHPActionRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    preOnboarding: `${prefix}/splash`,
    splash: `${prefix}/splash`,
    onboarding: createOnboardingRouteInfo(`${prefix}/onboarding`),
    postOnboarding: prefix,
    welcome: `${prefix}/welcome`,
    ...createJustfixCrossSiteVisitorRoutes(prefix),
    sue: `${prefix}/sue`,
    issues: `${prefix}/issues`,
    tenantChildren: `${prefix}/children`,
    accessForInspection: `${prefix}/access`,
    prevAttempts: `${prefix}/previous-attempts`,
    prevAttempts311Modal: `${prefix}/previous-attempts/311-modal`,
    harassmentApartment: `${prefix}/harassment/apartment`,
    harassmentAllegations1: `${prefix}/harassment/allegations/1`,
    harassmentAllegations2: `${prefix}/harassment/allegations/2`,
    harassmentExplain: `${prefix}/harassment/explain`,
    harassmentCaseHistory: `${prefix}/harassment/case-history`,
    yourLandlord: `${prefix}/your-landlord`,
    yourLandlordOptionalDetails: `${prefix}/your-landlord/optional`,
    prepare: `${prefix}/prepare`,
    waitForUpload: `${prefix}/wait`,
    reviewForms: `${prefix}/review`,
    reviewFormsSignModal: `${prefix}/review/sign-modal`,
    verifyEmail: `${prefix}/verify-email`,
    confirmation: `${prefix}/confirmation`,
    serviceInstructionsEmail: createHtmlEmailStaticPageRouteInfo(
      `${prefix}/service-instructions-email`
    ),
    exampleServiceInstructionsEmailForm: `${prefix}/service-instructions-email/example`,
    exampleServiceInstructionsEmail: createHtmlEmailStaticPageRouteInfo(
      `${prefix}/service-instructions-email/example`
    ),
    serviceInstructionsWebpage: `${prefix}/service-instructions`,
  };
}
