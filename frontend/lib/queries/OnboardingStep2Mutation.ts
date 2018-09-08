// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { OnboardingStep2Input } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: OnboardingStep2Mutation
// ====================================================

export interface OnboardingStep2Mutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface OnboardingStep2Mutation_output_session_onboardingStep2 {
  /**
   * Has the user received an eviction notice?
   */
  isInEviction: boolean;
  /**
   * Does the user need repairs in their apartment?
   */
  needsRepairs: boolean;
  /**
   * Is the user missing essential services like water?
   */
  hasNoServices: boolean;
  /**
   * Does the user have pests like rodents or bed bugs?
   */
  hasPests: boolean;
  /**
   * Has the user called 311 before?
   */
  hasCalled311: boolean;
}

export interface OnboardingStep2Mutation_output_session {
  onboardingStep2: OnboardingStep2Mutation_output_session_onboardingStep2 | null;
}

export interface OnboardingStep2Mutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: OnboardingStep2Mutation_output_errors[];
  session: OnboardingStep2Mutation_output_session | null;
}

export interface OnboardingStep2Mutation {
  output: OnboardingStep2Mutation_output;
}

export interface OnboardingStep2MutationVariables {
  input: OnboardingStep2Input;
}

export function fetchOnboardingStep2Mutation(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: OnboardingStep2MutationVariables): Promise<OnboardingStep2Mutation> {
  // The following query was taken from OnboardingStep2Mutation.graphql.
  return fetchGraphQL(`mutation OnboardingStep2Mutation($input: OnboardingStep2Input!) {
    output: onboardingStep2(input: $input) {
        errors {
            field,
            messages
        },
        session {
            onboardingStep2 {
                isInEviction
                needsRepairs
                hasNoServices
                hasPests
                hasCalled311
            }
        }
    }
}
`, args);
}