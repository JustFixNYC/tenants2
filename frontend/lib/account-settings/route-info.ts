import { ROUTE_PREFIX } from "../util/route-util";

export function createAccountSettingsRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
    name: `${prefix}/name`, // This is name rather than legalname to preserve backwards compatibility.
    preferredName: `${prefix}/preferred-name`,
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
