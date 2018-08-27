// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { OnboardingStep1Input } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: OnboardingStep1Mutation
// ====================================================

export interface OnboardingStep1Mutation_onboardingStep1_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface OnboardingStep1Mutation_onboardingStep1 {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: OnboardingStep1Mutation_onboardingStep1_errors[];
}

export interface OnboardingStep1Mutation {
  onboardingStep1: OnboardingStep1Mutation_onboardingStep1;
}

export interface OnboardingStep1MutationVariables {
  input: OnboardingStep1Input;
}

export function fetchOnboardingStep1Mutation(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: OnboardingStep1MutationVariables): Promise<OnboardingStep1Mutation> {
  // The following query was taken from OnboardingStep1Mutation.graphql.
  return fetchGraphQL(`mutation OnboardingStep1Mutation($input: OnboardingStep1Input!) {
    onboardingStep1(input: $input) {
        errors {
            field,
            messages
        }
    }
}
`, args);
}