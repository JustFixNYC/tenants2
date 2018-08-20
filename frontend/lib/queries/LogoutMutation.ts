// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: LogoutMutation
// ====================================================

export interface LogoutMutation_logout {
  ok: boolean;
  csrfToken: string;
}

export interface LogoutMutation {
  logout: LogoutMutation_logout;
}

export function fetchLogoutMutation(fetchGraphQL: (query: string, args?: any) => Promise<any>, ): Promise<LogoutMutation> {
  // The following query was taken from LogoutMutation.graphql.
  return fetchGraphQL(`mutation LogoutMutation {
    logout {
        ok,
        csrfToken
    }
}
`);
}