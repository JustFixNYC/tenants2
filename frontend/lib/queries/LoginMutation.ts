// This file was automatically generated and should not be edited.



/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: LoginMutation
// ====================================================

export interface LoginMutation_login {
  ok: boolean;
  csrfToken: string;
}

export interface LoginMutation {
  login: LoginMutation_login;
}

export interface LoginMutationVariables {
  username: string;
  password: string;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

//==============================================================
// END Enums and Input Objects
//==============================================================
export function fetchLoginMutation(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: LoginMutationVariables): Promise<LoginMutation> {
  // The following query was taken from LoginMutation.graphql.
  return fetchGraphQL(`mutation LoginMutation($username: String!, $password: String!) {
    login(username: $username, password: $password) {
        ok,
        csrfToken
    }
}
`, args);
}