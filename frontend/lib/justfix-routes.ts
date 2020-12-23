import History from "history";
import { OnboardingInfoSignupIntent, Borough } from "./queries/globalTypes";
import { inputToQuerystring } from "./networking/http-get-query-util";
import { ROUTE_PREFIX, createRoutesForSite } from "./util/route-util";
import { createDevRouteInfo } from "./dev/route-info";
import {
  createOnboardingRouteInfo,
  OnboardingRouteInfo,
} from "./onboarding/route-info";
import { createLetterOfComplaintRouteInfo } from "./loc/route-info";
import { createDataRequestsRouteInfo } from "./data-requests/route-info";
import { createHPActionRouteInfo } from "./hpaction/route-info";
import { createRentalHistoryRouteInfo } from "./rh/route-info";
import { createPasswordResetRouteInfo } from "./password-reset/route-info";
import { createEmergencyHPActionRouteInfo } from "./hpaction/emergency/route-info";

/**
 * Querystring argument for specifying the URL to redirect the
 * user to once they're done with the current page.
 */
export const NEXT = "next";

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

export type LocalizedRouteInfo = ReturnType<typeof createLocalizedRouteInfo>;

function createLocalizedRouteInfo(prefix: string) {
  const login = `${prefix}/login`;

  return {
    /** The locale prefix, e.g. `/en`. */
    [ROUTE_PREFIX]: prefix,

    /** The login page. */
    login,

    /**
     * Create a login link that redirects the user to the given location
     * after they've logged in.
     */
    createLoginLink(next: History.Location): string {
      return `${login}?${NEXT}=${encodeURIComponent(
        next.pathname + next.search
      )}`;
    },

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

  adminFrontappPlugin: "/admin/frontapp/",

  /**
   * Create an admin login link that redirects the user to the given location
   * after they've logged in.
   */
  createAdminLoginLink(next: History.Location): string {
    return `${this.adminLogin}?${NEXT}=${encodeURIComponent(
      next.pathname + next.search
    )}`;
  },

  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: createDevRouteInfo("/dev"),
});

export default JustfixRoutes;
