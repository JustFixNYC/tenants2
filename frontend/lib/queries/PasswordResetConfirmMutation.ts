// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { PasswordResetConfirmInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: PasswordResetConfirmMutation
// ====================================================

export interface PasswordResetConfirmMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface PasswordResetConfirmMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: PasswordResetConfirmMutation_output_errors[];
}

export interface PasswordResetConfirmMutation {
  output: PasswordResetConfirmMutation_output;
}

export interface PasswordResetConfirmMutationVariables {
  input: PasswordResetConfirmInput;
}

export const PasswordResetConfirmMutation = {
  // The following query was taken from PasswordResetConfirmMutation.graphql.
  graphQL: `mutation PasswordResetConfirmMutation($input: PasswordResetConfirmInput!) {
    output: passwordResetConfirm(input: $input) {
        errors {
            field,
            messages
        }
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: PasswordResetConfirmMutationVariables): Promise<PasswordResetConfirmMutation> {
    return fetchGraphQL(PasswordResetConfirmMutation.graphQL, args);
  }
};

export const fetchPasswordResetConfirmMutation = PasswordResetConfirmMutation.fetch;