// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { PasswordResetInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: PasswordResetMutation
// ====================================================

export interface PasswordResetMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface PasswordResetMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: PasswordResetMutation_output_errors[];
}

export interface PasswordResetMutation {
  output: PasswordResetMutation_output;
}

export interface PasswordResetMutationVariables {
  input: PasswordResetInput;
}

export const PasswordResetMutation = {
  // The following query was taken from PasswordResetMutation.graphql.
  graphQL: `mutation PasswordResetMutation($input: PasswordResetInput!) {
    output: passwordReset(input: $input) {
        errors {
            field,
            messages
        }
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: PasswordResetMutationVariables): Promise<PasswordResetMutation> {
    return fetchGraphQL(PasswordResetMutation.graphQL, args);
  }
};

export const fetchPasswordResetMutation = PasswordResetMutation.fetch;