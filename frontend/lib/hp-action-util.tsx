import { AllSessionInfo_feeWaiver, AllSessionInfo } from "./queries/AllSessionInfo";

/**
 * Returns whether the given session fee waiver info exists, and, if so, whether
 * it satisfies the criteria encapsulated by the given predicate function.
 */
export const hasFeeWaiverAnd = (condition: (fw: AllSessionInfo_feeWaiver) => boolean) => (session: AllSessionInfo) => (
  session.feeWaiver ? condition(session.feeWaiver) : false
);

export function isNotSuingForHarassment(session: AllSessionInfo): boolean {
  if (!session.hpActionDetails) return true;
  return session.hpActionDetails.sueForHarassment !== true;
}

export function isNotSuingForRepairs(session: AllSessionInfo): boolean {
  if (!session.hpActionDetails) return true;
  return session.hpActionDetails.sueForRepairs !== true;
}
