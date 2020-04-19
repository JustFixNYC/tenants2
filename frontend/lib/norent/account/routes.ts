import { ROUTE_PREFIX } from "../../util/route-util";

export type NorentAccountRouteInfo = ReturnType<
  typeof createNorentAccountRouteInfo
>;

export function createNorentAccountRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    phoneNumber: `${prefix}/phone/ask`,
    verifyPhoneNumber: `${prefix}/phone/verify`,
    setPassword: `${prefix}/password/set`,
    verifyPassword: `${prefix}/password/verify`,
    forgotPasswordModal: `${prefix}/password/verify/forgot-modal`,
    name: `${prefix}/name`,
    city: `${prefix}/city`,
    nationalAddress: `${prefix}/address/national`,
    nycAddress: `${prefix}/address/nyc`,
    email: `${prefix}/email`,
    create: `${prefix}/create`,
    update: `${prefix}/update`,
  };
}
