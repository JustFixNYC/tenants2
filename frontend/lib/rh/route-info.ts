import { ROUTE_PREFIX } from "../util/route-util";

export function createRentalHistoryRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    emailToDhcr: `${prefix}/email-to-dhcr.txt`,
    splash: `${prefix}/splash`,
    form: `${prefix}/form`,
    formAddressModal: `${prefix}/form/address-modal`,
    rsUnitsCheck: `${prefix}/rs-units-check`,
    preview: `${prefix}/preview`,
    confirmation: `${prefix}/confirmation`,
  };
}
