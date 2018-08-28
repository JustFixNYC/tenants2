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
}

export const graphQL = `fragment AllSessionInfo on SessionInfo {
    phoneNumber
    csrfToken
    isStaff
    onboardingStep1 {
        name
        address
        aptNumber
    }
}
`;