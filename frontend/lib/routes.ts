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
    step3: '/onboarding/step/3',
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
