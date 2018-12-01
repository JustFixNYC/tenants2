import { matchPath, RouteComponentProps } from 'react-router-dom';
import { OnboardingInfoSignupIntent } from './queries/globalTypes';

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
      preOnboarding: Routes.home,
      postOnboarding: Routes.loc.latestStep,
      onboarding: Routes.onboarding
    };

    case OnboardingInfoSignupIntent.HP: return Routes.hp;
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

/**
 * This namespace parallels our Routes object, providing useful types
 * related to specific routes.
 */
export namespace RouteTypes {
  export namespace onboarding {
    export namespace forIntent {
      export type RouteProps = RouteComponentProps<{ intent: string }>;
    }
  }
}

/**
 * This is an ad-hoc structure that defines URL routes for our app.
 */
const Routes = {
  /** The login page. */
  login: '/login',

  /**
   * The *admin* login page. We override Django's default admin login
   * here, so we need to make sure this URL matches the URL that Django
   * redirects users to.
   */
  adminLogin: '/admin/login/',

  /** The logout page. */
  logout: '/logout',

  /** The home page. */
  home: '/',

  /** The onboarding flow. */
  onboarding: createOnboardingRouteInfo('/onboarding'),

  /** The Letter of Complaint flow. */
  loc: {
    [ROUTE_PREFIX]: '/loc',
    latestStep: '/loc',
    home: '/loc/welcome',
    issues: createIssuesRouteInfo('/loc/issues'),
    accessDates: '/loc/access-dates',
    yourLandlord: '/loc/your-landlord',
    preview: '/loc/preview',
    previewSendConfirmModal: '/loc/preview/send-confirm-modal',
    confirmation: '/loc/confirmation'
  },

  /** The HP Action flow. */
  hp: {
    [ROUTE_PREFIX]: '/hp',
    latestStep: '/hp',
    preOnboarding: '/hp/splash',
    splash: '/hp/splash',
    onboarding: createOnboardingRouteInfo('/hp/onboarding'),
    postOnboarding: '/hp',
    welcome: '/hp/welcome',
    issues: createIssuesRouteInfo('/hp/issues'),
    yourLandlord: '/hp/your-landlord',
    waitForUpload: '/hp/wait',
    confirmation: '/hp/confirmation',
  },

  /**
   * Example pages used in integration tests, and other
   * development-related pages.
   */
  dev: {
    [ROUTE_PREFIX]: '/dev',
    home: '/dev',
    examples: {
      [ROUTE_PREFIX]: '/dev/examples',
      redirect: '/dev/examples/redirect',
      modal: '/dev/examples/modal',
      loadingPage: '/dev/examples/loading-page',
      form: '/dev/examples/form',
      formInModal: '/dev/examples/form/in-modal',
      loadable: '/dev/examples/loadable-page',
      clientSideError: '/dev/examples/client-side-error',
      metaTag: '/dev/examples/meta-tag'
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

  constructor(routes: any) {
    this.populate(routes);
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
    return this.existenceMap.size + this.parameterizedRoutes.length;
  }

  /**
   * Return an iterator that yields all routes that don't have parameters.
   */
  nonParameterizedRoutes(): IterableIterator<string> {
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
