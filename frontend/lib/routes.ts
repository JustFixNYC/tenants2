import { matchPath, RouteComponentProps } from 'react-router-dom';
import { OnboardingInfoSignupIntent } from './queries/globalTypes';
import i18n from './i18n';

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
export function getSignupIntentOnboardingInfo(intent: OnboardingInfoSignupIntent): SignupIntentOnboardingInfo {
  switch (intent) {
    case OnboardingInfoSignupIntent.LOC: return {
      preOnboarding: Routes.locale.home,
      postOnboarding: Routes.locale.loc.latestStep,
      onboarding: Routes.locale.onboarding
    };

    case OnboardingInfoSignupIntent.HP: return Routes.locale.hp;
  }
}

/**
 * Special route key indicating the prefix of a set of routes,
 * rather than a route that necessarily leads somewhere.
 */
export const ROUTE_PREFIX = 'prefix';

export type IssuesRouteInfo = {
  [ROUTE_PREFIX]: string,
  home: string,
  area: {
    parameterizedRoute: string,
    create: (area: string) => string,
  }
}

export type PasswordResetRouteInfo = ReturnType<typeof createPasswordResetRouteInfo>;

function createPasswordResetRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    start: `${prefix}/start`,
    verify: `${prefix}/verify`,
    confirm: `${prefix}/confirm`,
    done: `${prefix}/done`
  };
}

export type IssuesRouteAreaProps = RouteComponentProps<{ area: string }>;

function createIssuesRouteInfo(prefix: string): IssuesRouteInfo {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
    area: {
      parameterizedRoute: `${prefix}/:area`,
      create: (area: string) => `${prefix}/${area}`,
    }
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
    step2: `${prefix}/step/2`,
    step2EvictionModal: `${prefix}/step/2/eviction-modal`,
    step3: `${prefix}/step/3`,
    step3RentStabilizedModal: `${prefix}/step/3/rent-stabilized-modal`,
    step3MarketRateModal: `${prefix}/step/3/market-rate-modal`,
    step3NychaModal: `${prefix}/step/3/nycha-modal`,
    step3OtherModal: `${prefix}/step/3/other-modal`,
    step3NoLeaseModal: `${prefix}/step/3/no-lease-modal`,
    step3LearnMoreModals: {
      rentStabilized: `${prefix}/step/3/learn-more-rent-stabilized-modal`,
      marketRate: `${prefix}/step/3/learn-more-market-rate-modal`,
      noLease: `${prefix}/step/3/learn-more-no-lease-modal`,
    },
    step4: `${prefix}/step/4`,
    step4TermsModal: `${prefix}/step/4/terms-modal`,
  };
}

export type LetterOfComplaintInfo = ReturnType<typeof createLetterOfComplaintRouteInfo>;

function createLetterOfComplaintRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    home: `${prefix}/welcome`,
    issues: createIssuesRouteInfo(`${prefix}/issues`),
    accessDates: `${prefix}/access-dates`,
    yourLandlord: `${prefix}/your-landlord`,
    preview: `${prefix}/preview`,
    previewSendConfirmModal: `${prefix}/preview/send-confirm-modal`,
    confirmation: `${prefix}/confirmation`
  };
}

export type HPActionInfo = ReturnType<typeof createHPActionRouteInfo>;

function createHPActionRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    preOnboarding: `${prefix}/splash`,
    splash: `${prefix}/splash`,
    onboarding: createOnboardingRouteInfo(`${prefix}/onboarding`),
    postOnboarding: prefix,
    welcome: `${prefix}/welcome`,
    issues: createIssuesRouteInfo(`${prefix}/issues`),
    tenantChildren: `${prefix}/children`,
    accessForInspection: `${prefix}/access`,
    prevAttempts: `${prefix}/previous-attempts`,
    prevAttempts311Modal: `${prefix}/previous-attempts/311-modal`,
    urgentAndDangerous: `${prefix}/urgency`,
    feeWaiverStart: `${prefix}/fee-waiver`,
    feeWaiverMisc: `${prefix}/fee-waiver/misc`,
    feeWaiverIncome: `${prefix}/fee-waiver/income`,
    feeWaiverExpenses: `${prefix}/fee-waiver/expenses`,
    feeWaiverPublicAssistance: `${prefix}/fee-waiver/public-assistance`,
    yourLandlord: `${prefix}/your-landlord`,
    waitForUpload: `${prefix}/wait`,
    confirmation: `${prefix}/confirmation`,
  }
}

export type LocalizedRouteInfo = ReturnType<typeof createLocalizedRouteInfo>;

function createLocalizedRouteInfo(prefix: string) {
  return {
    /** The login page. */
    login: `${prefix}/login`,

    /** The logout page. */
    logout: `${prefix}/logout`,

    /** The home page. */
    home: `${prefix}/`,

    /** The password reset flow. */
    passwordReset: createPasswordResetRouteInfo(`${prefix}/password-reset`),

    /** The onboarding flow. */
    onboarding: createOnboardingRouteInfo(`${prefix}/onboarding`),

    /** The Letter of Complaint flow. */
    loc: createLetterOfComplaintRouteInfo(`${prefix}/loc`),

    /** The HP Action flow. */
    hp: createHPActionRouteInfo(`${prefix}/hp`),
  }
}

let currentLocaleRoutes: LocalizedRouteInfo|null = null;

i18n.addChangeListener(() => { currentLocaleRoutes = null; });

/**
 * This is an ad-hoc structure that defines URL routes for our app.
 */
const Routes = {
  /** Localized routes for the user's currently-selected locale. */
  get locale(): LocalizedRouteInfo {
    if (currentLocaleRoutes === null) {
      currentLocaleRoutes = createLocalizedRouteInfo(i18n.localePathPrefix);
    }
    return currentLocaleRoutes;
  },

  /**
   * The *admin* login page. We override Django's default admin login
   * here, so we need to make sure this URL matches the URL that Django
   * redirects users to.
   */
  adminLogin: '/admin/login/',

  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: {
    [ROUTE_PREFIX]: '/dev',
    home: '/dev/',
    examples: {
      [ROUTE_PREFIX]: '/dev/examples',
      redirect: '/dev/examples/redirect',
      modal: '/dev/examples/modal',
      loadingPage: '/dev/examples/loading-page',
      form: '/dev/examples/form',
      formInModal: '/dev/examples/form/in-modal',
      radio: '/dev/examples/radio',
      loadable: '/dev/examples/loadable-page',
      clientSideError: '/dev/examples/client-side-error',
      metaTag: '/dev/examples/meta-tag',
      query: '/dev/examples/query'
    }
  }
};

export default Routes;

/**
 * Returns if any of the arguments represents a route that
 * primarily presents the user with a modal.
 */
export function isModalRoute(...paths: string[]): boolean {
  for (let path of paths) {
    if (/-modal/.test(path)) {
      return true;
    }
  }
  return false;
}

export function isParameterizedRoute(path: string): boolean {
  return path.indexOf(':') !== -1;
}

/**
 * A class that keeps track of what routes actually exist,
 * because apparently React Router is unable to do this
 * for us.
 */
export class RouteMap {
  private existenceMap: Map<string, boolean> = new Map();
  private parameterizedRoutes: string[] = [];
  private isInitialized = false;

  constructor(private readonly routes: any) {
  }

  private ensureIsInitialized() {
    if (!this.isInitialized) {
      this.populate(this.routes);
      this.isInitialized = true;
    }
  }

  private populate(routes: any) {
    Object.keys(routes).forEach(name => {
      const value = routes[name];
      if (typeof(value) === 'string' && name !== ROUTE_PREFIX) {
        if (isParameterizedRoute(value)) {
          this.parameterizedRoutes.push(value);
        } else {
          this.existenceMap.set(value, true);
        }
      } else if (value && typeof(value) === 'object') {
        this.populate(value);
      }
    });
  }

  get size(): number {
    this.ensureIsInitialized();
    return this.existenceMap.size + this.parameterizedRoutes.length;
  }

  /**
   * Return an iterator that yields all routes that don't have parameters.
   */
  nonParameterizedRoutes(): IterableIterator<string> {
    this.ensureIsInitialized();
    return this.existenceMap.keys();
  }

  /**
   * Given a concrete pathname, returns whether a route for it will
   * potentially match.
   * 
   * Note that it doesn't validate that route parameters are necessarily
   * valid beyond their syntactic structure, e.g. passing
   * `/objects/200` to this method may return true, but in reality there
   * may be no object with id "200". Such cases are for route handlers
   * further down the view heirarchy to resolve.
   */
  exists(pathname: string): boolean {
    this.ensureIsInitialized();
    if (this.existenceMap.has(pathname)) {
      return true;
    }
    for (let route of this.parameterizedRoutes) {
      const match = matchPath(pathname, { path: route });
      if (match && match.isExact) {
        return true;
      }
    }
    return false;
  }
}

export const routeMap = new RouteMap(Routes);
