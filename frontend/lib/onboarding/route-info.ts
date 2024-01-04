import { ROUTE_PREFIX } from "../util/route-util";

export type OnboardingRouteInfo = ReturnType<typeof createOnboardingRouteInfo>;

export function createOnboardingRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    step1: `${prefix}/step/1`,
    step2AddressModal: `${prefix}/step/2/address-modal`,
    step2ConfirmAddressModal: `${prefix}/step/2/confirm-address-modal`,
    step2: `${prefix}/step/2`,
    step3: `${prefix}/step/3`,
    step3RentStabilizedModal: `${prefix}/step/3/rent-stabilized-modal`,
    step3MarketRateModal: `${prefix}/step/3/market-rate-modal`,
    step3NotSureModal: `${prefix}/step/3/not-sure-modal`,
    step3LearnMoreModals: {
      rentStabilized: `${prefix}/step/3/learn-more-rent-stabilized-modal`,
      rentControlled: `${prefix}/step/3/learn-more-rent-controlled-modal`,
      marketRate: `${prefix}/step/3/learn-more-market-rate-modal`,
      NYCHA: `${prefix}/step/3/learn-more-nycha-modal`,
      otherAffordable: `${prefix}/step/3/learn-more-other-affordable-modal`,
      notSure: `${prefix}/step/3/learn-more-not-sure-modal`,
    },
    step4: `${prefix}/step/4`,
    step4TermsModal: `${prefix}/step/4/terms-modal`,
    thanks: `${prefix}/thanks`,
  };
}
