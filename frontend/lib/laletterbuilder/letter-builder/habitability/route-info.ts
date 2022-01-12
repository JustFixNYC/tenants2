import { ROUTE_PREFIX } from "../../../util/route-util";

export type HabitabilityRouteInfo = ReturnType<
  typeof createHabitabilityRouteInfo
>;

export function createHabitabilityRouteInfo(prefix: string) {
  const HABITABILITY_PREFIX = "habitability";
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    landlordName: `${prefix}/${HABITABILITY_PREFIX}/landlord/name`,
    landlordEmail: `${prefix}/${HABITABILITY_PREFIX}/landlord/email`,
    landlordAddress: `${prefix}/${HABITABILITY_PREFIX}/landlord/address`,
    landlordAddressConfirmModal: `${prefix}/${HABITABILITY_PREFIX}/landlord/address/confirm-modal`,
    confirmation: `${prefix}/${HABITABILITY_PREFIX}/confirmation`,
  };
}
