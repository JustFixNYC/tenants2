// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: AllSessionInfo
// ====================================================

export interface AllSessionInfo_onboardingStep1 {
  name: string;
  address: string;
  aptNumber: string;
  borough: string;
}

export interface AllSessionInfo_onboardingStep2 {
  /**
   * Has the user received an eviction notice?
   */
  isInEviction: boolean;
  /**
   * Does the user need repairs in their apartment?
   */
  needsRepairs: boolean;
  /**
   * Is the user missing essential services like water?
   */
  hasNoServices: boolean;
  /**
   * Does the user have pests like rodents or bed bugs?
   */
  hasPests: boolean;
  /**
   * Has the user called 311 before?
   */
  hasCalled311: boolean;
}

export interface AllSessionInfo {
  /**
   * The phone number of the currently logged-in user, or null if not logged-in.
   */
  phoneNumber: string | null;
  /**
   * The cross-site request forgery (CSRF) token.
   */
  csrfToken: string;
  /**
   * Whether or not the currently logged-in user is a staff member.
   */
  isStaff: boolean;
  onboardingStep1: AllSessionInfo_onboardingStep1 | null;
  onboardingStep2: AllSessionInfo_onboardingStep2 | null;
}

export const graphQL = `fragment AllSessionInfo on SessionInfo {
    phoneNumber
    csrfToken
    isStaff
    onboardingStep1 {
        name
        address
        aptNumber,
        borough
    },
    onboardingStep2 {
        isInEviction
        needsRepairs
        hasNoServices
        hasPests
        hasCalled311
    }
}
`;