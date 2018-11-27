// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { OnboardingStep1Input } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: OnboardingStep1Mutation
// ====================================================

export interface OnboardingStep1Mutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface OnboardingStep1Mutation_output_session_onboardingStep1 {
  firstName: string;
  lastName: string;
  /**
   * The reason the user originally signed up with us.
   */
  signupIntent: string;
  /**
   * The user's address. Only street name and number are required.
   */
  address: string;
  aptNumber: string;
  /**
   * The New York City borough the user's address is in.
   */
  borough: string;
}

export interface OnboardingStep1Mutation_output_session {
  onboardingStep1: OnboardingStep1Mutation_output_session_onboardingStep1 | null;
}

export interface OnboardingStep1Mutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: OnboardingStep1Mutation_output_errors[];
  session: OnboardingStep1Mutation_output_session | null;
}

export interface OnboardingStep1Mutation {
  output: OnboardingStep1Mutation_output;
}

export interface OnboardingStep1MutationVariables {
  input: OnboardingStep1Input;
}

export const OnboardingStep1Mutation = {
  // The following query was taken from OnboardingStep1Mutation.graphql.
  graphQL: `mutation OnboardingStep1Mutation($input: OnboardingStep1Input!) {
    output: onboardingStep1(input: $input) {
        errors {
            field,
            messages
        },
        session {
            onboardingStep1 {
                firstName,
                lastName,
                signupIntent,
                address,
                aptNumber,
                borough
            }
        }
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: OnboardingStep1MutationVariables): Promise<OnboardingStep1Mutation> {
    return fetchGraphQL(OnboardingStep1Mutation.graphQL, args);
  }
};

export const fetchOnboardingStep1Mutation = OnboardingStep1Mutation.fetch;