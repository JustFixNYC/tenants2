// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { LetterRequestInput, LetterRequestMailChoice } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: LetterRequestMutation
// ====================================================

export interface LetterRequestMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface LetterRequestMutation_output_session_letterRequest {
  updatedAt: any;
  /**
   * How the letter of complaint will be mailed.
   */
  mailChoice: LetterRequestMailChoice;
}

export interface LetterRequestMutation_output_session {
  letterRequest: LetterRequestMutation_output_session_letterRequest | null;
}

export interface LetterRequestMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: LetterRequestMutation_output_errors[];
  session: LetterRequestMutation_output_session | null;
}

export interface LetterRequestMutation {
  output: LetterRequestMutation_output;
}

export interface LetterRequestMutationVariables {
  input: LetterRequestInput;
}

export const LetterRequestMutation = {
  // The following query was taken from LetterRequestMutation.graphql.
  graphQL: `mutation LetterRequestMutation($input: LetterRequestInput!) {
    output: letterRequest(input: $input) {
        errors {
            field,
            messages
        },
        session {
            letterRequest {
                updatedAt
                mailChoice
            }
        }
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: LetterRequestMutationVariables): Promise<LetterRequestMutation> {
    return fetchGraphQL(LetterRequestMutation.graphQL, args);
  }
};

export const fetchLetterRequestMutation = LetterRequestMutation.fetch;