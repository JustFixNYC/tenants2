import { ROUTE_PREFIX } from "../util/route-util";

export function createAccountSettingsRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
    legalname: `${prefix}/legalname`,
    preferredname: `${prefix}/preferredname`,
    phoneNumber: `${prefix}/phone`,
    email: `${prefix}/email`,
    address: `${prefix}/address`,
    confirmAddressModal: `${prefix}/address/confirm-modal`,
    leaseType: `${prefix}/lease`,
    publicAssistance: `${prefix}/public-assistance`,
  };
}

export type AccountSettingsRouteInfo = ReturnType<
  typeof createAccountSettingsRouteInfo
>;
