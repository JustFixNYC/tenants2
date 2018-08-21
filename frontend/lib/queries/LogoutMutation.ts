// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: LogoutMutation
// ====================================================

export interface LogoutMutation_logout_session {
  /**
   * The phone number of the currently logged-in user, or null if not logged-in.
   */
  phoneNumber: string | null;
  /**
   * The cross-site request forgery (CSRF) token.
   */
  csrfToken: string;
}

export interface LogoutMutation_logout {
  session: LogoutMutation_logout_session;
}

export interface LogoutMutation {
  logout: LogoutMutation_logout;
}

export function fetchLogoutMutation(fetchGraphQL: (query: string, args?: any) => Promise<any>, ): Promise<LogoutMutation> {
  // The following query was taken from LogoutMutation.graphql.
  return fetchGraphQL(`mutation LogoutMutation {
    logout {
        session {
            phoneNumber,
            csrfToken
        }
    }
}
`);
}