import { ROUTE_PREFIX } from "../../util/route-util";

export type NorentAccountRouteInfo = ReturnType<
  typeof createNorentAccountRouteInfo
>;

export type StartAccountOrLoginRouteInfo = ReturnType<
  typeof createStartAccountOrLoginRouteInfo
>;

function createStartAccountOrLoginRouteInfo(prefix: string) {
  return {
    phoneNumber: `${prefix}/phone/ask`,
    verifyPhoneNumber: `${prefix}/phone/verify`,
    setPassword: `${prefix}/password/set`,
    verifyPassword: `${prefix}/password/verify`,
    forgotPasswordModal: `${prefix}/password/verify/forgot-modal`,
  };
}

export function createNorentAccountRouteInfo(prefix: string) {
  return {
    [ROUTE_PREFIX]: prefix,
    latestStep: prefix,
    welcome: `${prefix}/welcome`,
    ...createStartAccountOrLoginRouteInfo(prefix),
    name: `${prefix}/name`,
    city: `${prefix}/city`,
    nationalAddress: `${prefix}/address/national`,
    nycAddress: `${prefix}/address/nyc`,
    email: `${prefix}/email`,
    create: `${prefix}/create`,
    update: `${prefix}/update`,
  };
}
