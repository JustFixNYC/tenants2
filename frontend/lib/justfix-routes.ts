import { RouteComponentProps } from "react-router-dom";
import { OnboardingInfoSignupIntent, Borough } from "./queries/globalTypes";
import { inputToQuerystring } from "./networking/http-get-query-util";
import { ROUTE_PREFIX, createRoutesForSite } from "./util/route-util";
import { createDevRouteInfo } from "./dev/routes";
import { createLetterStaticPageRouteInfo } from "./static-page/routes";

/**
 * Metadata about signup intents.
 */
type SignupIntentOnboardingInfo = {
  /** The page users land on before starting onboarding. */
  preOnboarding: string;

  /** The page users are sent to after onboarding. */
  postOnboarding: string;

  /** The actual onboarding routes. */
  onboarding: OnboardingRouteInfo;
};

export type JustfixCrossSiteVisitorRouteInfo = ReturnType<
  typeof createJustfixCrossSiteVisitorRoutes
>;

function createJustfixCrossSiteVisitorRoutes(prefix: string) {
  return {
    crossSiteAgreeToTerms: `${prefix}/terms`,
  };
}

/**
 * Ideally this would be a map, but TypeScript doesn't let us
 * use a union type as an index signature, so I guess we'll have
 * to make it a function.
 */
export function getSignupIntentOnboardingInfo(
  intent: OnboardingInfoSignupIntent
): SignupIntentOnboardingInfo {
  switch (intent) {
    case OnboardingInfoSignupIntent.NORENT:
    // TODO: Actually figure out something to do here, instead of just
    // falling through to LOC.

    case OnboardingInfoSignupIntent.LOC:
      return {
        preOnboarding: JustfixRoutes.locale.loc.splash,
        postOnboarding: JustfixRoutes.locale.loc.latestStep,
        onboarding: JustfixRoutes.locale.locOnboarding,
      };

    case OnboardingInfoSignupIntent.HP:
      return JustfixRoutes.locale.hp;
    case OnboardingInfoSignupIntent.EHP:
      return JustfixRoutes.locale.ehp;
  }
}

export type IssuesRouteInfo = {
  [ROUTE_PREFIX]: string;
  home: string;
  modal: string;
  area: {
    parameterizedRoute: string;
    create: (area: string) => string;
  };
};

export type PasswordResetRouteInfo = ReturnType<
  typeof createPasswordResetRouteInfo
>;

function createPasswordResetRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    start: `${prefix}/start`,
    verify: `${prefix}/verify`,
    confirm: `${prefix}/confirm`,
    done: `${prefix}/done`,
  };
}

export type IssuesRouteAreaProps = RouteComponentProps<{ area: string }>;

function createIssuesRouteInfo(prefix: string): IssuesRouteInfo {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
    modal: `${prefix}/covid-risk-modal`,
    area: {
      parameterizedRoute: `${prefix}/:area`,
      create: (area: string) => `${prefix}/${area}`,
    },
  };
}

export type OnboardingRouteInfo = ReturnType<typeof createOnboardingRouteInfo>;

function createOnboardingRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    step1: `${prefix}/step/1`,
    step1AddressModal: `${prefix}/step/1/address-modal`,
    step1ConfirmAddressModal: `${prefix}/step/1/confirm-address-modal`,
    step3: `${prefix}/step/3`,
    step3RentStabilizedModal: `${prefix}/step/3/rent-stabilized-modal`,
    step3MarketRateModal: `${prefix}/step/3/market-rate-modal`,
    step3OtherModal: `${prefix}/step/3/other-modal`,
    step3NoLeaseModal: `${prefix}/step/3/no-lease-modal`,
    step3LearnMoreModals: {
      rentStabilized: `${prefix}/step/3/learn-more-rent-stabilized-modal`,
      marketRate: `${prefix}/step/3/learn-more-market-rate-modal`,
      noLease: `${prefix}/step/3/learn-more-no-lease-modal`,
    },
    step4: `${prefix}/step/4`,
    step4TermsModal: `${prefix}/step/4/terms-modal`,
    thanks: `${prefix}/thanks`,
  };
}

export type LetterOfComplaintInfo = ReturnType<
  typeof createLetterOfComplaintRouteInfo
>;

function createLetterOfComplaintRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    /** The sample letter content (HTML and PDF versions). */
    sampleLetterContent: createLetterStaticPageRouteInfo(
      `${prefix}/sample-letter`
    ),
    splash: `${prefix}/splash`,
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

export type HPActionInfo = ReturnType<typeof createHPActionRouteInfo>;

function createEmergencyHPActionRouteInfo(prefix: string) {
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
  };
}

function createHPActionRouteInfo(prefix: string) {
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
    issues: createIssuesRouteInfo(`${prefix}/issues`),
    tenantChildren: `${prefix}/children`,
    accessForInspection: `${prefix}/access`,
    prevAttempts: `${prefix}/previous-attempts`,
    prevAttempts311Modal: `${prefix}/previous-attempts/311-modal`,
    urgentAndDangerous: `${prefix}/urgency`,
    harassmentApartment: `${prefix}/harassment/apartment`,
    harassmentAllegations1: `${prefix}/harassment/allegations/1`,
    harassmentAllegations2: `${prefix}/harassment/allegations/2`,
    harassmentExplain: `${prefix}/harassment/explain`,
    harassmentCaseHistory: `${prefix}/harassment/case-history`,
    feeWaiverStart: `${prefix}/fee-waiver`,
    feeWaiverMisc: `${prefix}/fee-waiver/misc`,
    feeWaiverIncome: `${prefix}/fee-waiver/income`,
    feeWaiverExpenses: `${prefix}/fee-waiver/expenses`,
    feeWaiverPublicAssistance: `${prefix}/fee-waiver/public-assistance`,
    yourLandlord: `${prefix}/your-landlord`,
    ready: `${prefix}/ready`,
    waitForUpload: `${prefix}/wait`,
    confirmation: `${prefix}/confirmation`,
  };
}

function createDataRequestsRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
    multiLandlord: `${prefix}/multi-landlord`,
  };
}

function createRentalHistoryRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    emailToDhcr: `${prefix}/email-to-dhcr.txt`,
    splash: `${prefix}/splash`,
    form: `${prefix}/form`,
    formAddressModal: `${prefix}/form/address-modal`,
    preview: `${prefix}/preview`,
    confirmation: `${prefix}/confirmation`,
  };
}

export type LocalizedRouteInfo = ReturnType<typeof createLocalizedRouteInfo>;

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The locale prefix, e.g. `/en`. */
    [ROUTE_PREFIX]: prefix,

    /** The login page. */
    login: `${prefix}/login`,

    /** The logout page. */
    logout: `${prefix}/logout`,

    /** The home page. */
    home: `${prefix}/`,

    /** The home page with a pre-filled search address. */
    homeWithSearch(
      options: { address: string; borough: Borough | null } | null
    ) {
      if (options && options.borough) {
        const { address, borough } = options;
        return `${this.home}${inputToQuerystring({ address, borough })}`;
      }
      return this.home;
    },

    /** The help page. */
    help: `${prefix}/help`,

    /** The password reset flow. */
    passwordReset: createPasswordResetRouteInfo(`${prefix}/password-reset`),

    /**
     * The onboarding flow for Letter of Complaint (onboarding flows
     * for other products are embedded within their product's prefix).
     */
    locOnboarding: createOnboardingRouteInfo(`${prefix}/onboarding`),

    /** The Letter of Complaint flow. */
    loc: createLetterOfComplaintRouteInfo(`${prefix}/loc`),

    /** The HP Action flow. */
    hp: createHPActionRouteInfo(`${prefix}/hp`),

    /** The Emergency HP Action flow (COVID-19). */
    ehp: createEmergencyHPActionRouteInfo(`${prefix}/ehp`),

    /** The Rental History flow. */

    rh: createRentalHistoryRouteInfo(`${prefix}/rh`),

    /** The data requests portal.  */
    dataRequests: createDataRequestsRouteInfo(`${prefix}/data-requests`),

    /** Legacy experimental data-driven onboarding. */
    legacyDataDrivenOnboarding: `${prefix}/ddo`,
  };
}

/**
 * This is an ad-hoc structure that defines URL routes for our app.
 */
const JustfixRoutes = createRoutesForSite(createLocalizedRouteInfo, {
  /**
   * The *admin* login page. We override Django's default admin login
   * here, so we need to make sure this URL matches the URL that Django
   * redirects users to.
   */
  adminLogin: "/admin/login/",

  adminConversations: "/admin/conversations/",

  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: createDevRouteInfo("/dev"),
});

export default JustfixRoutes;
