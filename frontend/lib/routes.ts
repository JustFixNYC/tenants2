const Routes = {
  /** The login page. */
  login: '/login',

  /** The logout page. */
  logout: '/logout',

  /** The home page. */
  home: '/',

  /** The onboarding flow. */
  onboarding: {
    prefix: '/onboarding',
    latestStep: '/onboarding',
    step1: '/onboarding/step/1',
    step1AddressModal: '/onboarding/step/1/address-modal',
    step2: '/onboarding/step/2',
    step2EvictionModal: '/onboarding/step/2/eviction-modal',
    step3: '/onboarding/step/3',
    step3RentStabilizedModal: '/onboarding/step/3/rent-stabilized-modal',
    step3MarketRateModal: '/onboarding/step/3/market-rate-modal',
    step4: '/onboarding/step/4'
  },

  /** Example pages used in integration tests. */
  examples: {
    redirect: '/__example-redirect',
    modal: '/__example-modal',
    loadable: '/__loadable-example-page'
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

/**
 * A class that keeps track of what routes actually exist,
 * because apparently React Router is unable to do this
 * for us.
 */
export class RouteMap {
  private existenceMap: Map<string, boolean> = new Map();

  constructor(routes: any) {
    this.populate(routes);
  }

  private populate(routes: any) {
    Object.keys(routes).forEach(name => {
      const value = routes[name];
      if (typeof(value) === 'string') {
        this.existenceMap.set(value, true);
      } else {
        this.populate(value);
      }
    });
  }

  exists(pathname: string): boolean {
    return this.existenceMap.has(pathname);
  }
}

export const routeMap = new RouteMap(Routes);
