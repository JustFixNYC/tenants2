import { ROUTE_PREFIX } from "../util/route-util";

export type OnboardingRouteInfo = ReturnType<typeof createOnboardingRouteInfo>;

export function createOnboardingRouteInfo(prefix: string) {
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
