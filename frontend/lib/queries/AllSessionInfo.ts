// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: AllSessionInfo
// ====================================================

export interface AllSessionInfo {
  /**
   * The phone number of the currently logged-in user, or null if not logged-in.
   */
  phoneNumber: string | null;
  /**
   * The cross-site request forgery (CSRF) token.
   */
  csrfToken: string;
}

export const graphQL = `fragment AllSessionInfo on SessionInfo {
    phoneNumber
    csrfToken
}
`;