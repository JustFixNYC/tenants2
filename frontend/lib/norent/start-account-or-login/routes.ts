export type StartAccountOrLoginRouteInfo = ReturnType<
  typeof createStartAccountOrLoginRouteInfo
>;

/**
 * This function maps URL paths to our routes within the NoRent Account Creation/Login flow.
 * To find the actual definition of these routes, check out
 * the `steps.tsx` file in the same directory as this file.
 */
export function createStartAccountOrLoginRouteInfo(prefix: string) {
  return {
    phoneNumber: `${prefix}/phone/ask`,
    phoneNumberTermsModal: `${prefix}/phone/ask/terms-modal`,
    migrateLegacyTenantsUser: `${prefix}/migrate-legacy-tenants-user`,
    verifyPhoneNumber: `${prefix}/phone/verify`,
    setPassword: `${prefix}/password/set`,
    verifyPassword: `${prefix}/password/verify`,
    forgotPasswordModal: `${prefix}/password/verify/forgot-modal`,
  };
}
