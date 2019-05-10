// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { PasswordResetVerificationCodeInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: PasswordResetVerificationCodeMutation
// ====================================================

export interface PasswordResetVerificationCodeMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface PasswordResetVerificationCodeMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: PasswordResetVerificationCodeMutation_output_errors[];
}

export interface PasswordResetVerificationCodeMutation {
  output: PasswordResetVerificationCodeMutation_output;
}

export interface PasswordResetVerificationCodeMutationVariables {
  input: PasswordResetVerificationCodeInput;
}

export const PasswordResetVerificationCodeMutation = {
  // The following query was taken from PasswordResetVerificationCodeMutation.graphql.
  graphQL: `mutation PasswordResetVerificationCodeMutation($input: PasswordResetVerificationCodeInput!) {
    output: passwordResetVerificationCode(input: $input) {
        errors {
            field,
            messages
        }
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: PasswordResetVerificationCodeMutationVariables): Promise<PasswordResetVerificationCodeMutation> {
    return fetchGraphQL(PasswordResetVerificationCodeMutation.graphQL, args);
  }
};

export const fetchPasswordResetVerificationCodeMutation = PasswordResetVerificationCodeMutation.fetch;