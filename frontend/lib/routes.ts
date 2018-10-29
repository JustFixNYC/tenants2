import { matchPath, RouteComponentProps } from 'react-router-dom';

/**
 * Special route key indicating the prefix of a set of routes,
 * rather than a route that necessarily leads somewhere.
 */
export const ROUTE_PREFIX = 'prefix';

/**
 * This namespace parallels our Routes object, providing useful types
 * related to specific routes.
 */
export namespace RouteTypes {
  export namespace loc {
    export namespace issues {
      export namespace area {
        export type RouteProps = RouteComponentProps<{ area: string }>;
      }
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
  onboarding: {
    [ROUTE_PREFIX]: '/onboarding',
    latestStep: '/onboarding',
    step1: '/onboarding/step/1',
    step1AddressModal: '/onboarding/step/1/address-modal',
    step1ConfirmAddressModal: '/onboarding/step/1/confirm-address-modal',
    step2: '/onboarding/step/2',
    step2EvictionModal: '/onboarding/step/2/eviction-modal',
    step3: '/onboarding/step/3',
    step3RentStabilizedModal: '/onboarding/step/3/rent-stabilized-modal',
    step3MarketRateModal: '/onboarding/step/3/market-rate-modal',
    step3NychaModal: '/onboarding/step/3/nycha-modal',
    step3OtherModal: '/onboarding/step/3/other-modal',
    step3LearnMoreModals: {
      rentStabilized: '/onboarding/step/3/learn-more-rent-stabilized-modal',
      marketRate: '/onboarding/step/3/learn-more-market-rate-modal',
      noLease: '/onboarding/step/3/learn-more-no-lease-modal',
    },
    step4: '/onboarding/step/4',
    step4TermsModal: '/onboarding/step/4/terms-modal',
  },

  /** The Letter of Complaint flow. */
  loc: {
    [ROUTE_PREFIX]: '/loc',
    latestStep: '/loc',
    home: '/loc/welcome',
    issues: {
      [ROUTE_PREFIX]: '/loc/issues',
      home: '/loc/issues',
      area: {
        parameterizedRoute: '/loc/issues/:area',
        create: (area: string) => `/loc/issues/${area}`,
      }
    },
    accessDates: '/loc/access-dates',
    yourLandlord: '/loc/your-landlord',
    preview: '/loc/preview',
    previewSendConfirmModal: '/loc/preview/send-confirm-modal',
    confirmation: '/loc/confirmation'
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
