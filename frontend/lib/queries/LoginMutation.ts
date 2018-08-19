// This file was automatically generated and should not be edited.



/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: LoginMutation
// ====================================================

export interface LoginMutation_login_errors {
  field: string | null;
  messages: (string | null)[] | null;
}

export interface LoginMutation_login {
  errors: (LoginMutation_login_errors | null)[] | null;
  csrfToken: string | null;
}

export interface LoginMutation {
  login: LoginMutation_login;
}

export interface LoginMutationVariables {
  input: LoginInput;
}

/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * 
 */
export interface LoginInput {
  phoneNumber: string;
  password: string;
  clientMutationId?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
export function fetchLoginMutation(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: LoginMutationVariables): Promise<LoginMutation> {
  // The following query was taken from LoginMutation.graphql.
  return fetchGraphQL(`mutation LoginMutation($input: LoginInput!) {
    login(input: $input) {
        errors {
            field,
            messages
        },
        csrfToken
    }
}
`, args);
}