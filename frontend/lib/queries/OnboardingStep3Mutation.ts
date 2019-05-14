// This file was automatically generated and should not be edited.

import * as ExtendedFormFieldErrors from './ExtendedFormFieldErrors'
/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { OnboardingStep3Input } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: OnboardingStep3Mutation
// ====================================================

export interface OnboardingStep3Mutation_output_errors_extendedMessages {
  /**
   * A human-readable validation error.
   */
  message: string;
  /**
   * A machine-readable representation of the error.
   */
  code: string | null;
}

export interface OnboardingStep3Mutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of validation errors with extended metadata.
   */
  extendedMessages: OnboardingStep3Mutation_output_errors_extendedMessages[];
}

export interface OnboardingStep3Mutation_output_session_onboardingStep3 {
  /**
   * The type of lease the user has on their dwelling.
   */
  leaseType: string;
  /**
   * Does the user receive public assistance, e.g. Section 8?
   */
  receivesPublicAssistance: boolean;
}

export interface OnboardingStep3Mutation_output_session {
  onboardingStep3: OnboardingStep3Mutation_output_session_onboardingStep3 | null;
}

export interface OnboardingStep3Mutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: OnboardingStep3Mutation_output_errors[];
  session: OnboardingStep3Mutation_output_session | null;
}

export interface OnboardingStep3Mutation {
  output: OnboardingStep3Mutation_output;
}

export interface OnboardingStep3MutationVariables {
  input: OnboardingStep3Input;
}

export const OnboardingStep3Mutation = {
  // The following query was taken from OnboardingStep3Mutation.graphql.
  graphQL: `mutation OnboardingStep3Mutation($input: OnboardingStep3Input!) {
    output: onboardingStep3(input: $input) {
        errors { ...ExtendedFormFieldErrors },
        session {
            onboardingStep3 {
                leaseType
                receivesPublicAssistance
            }
        }
    }
}

${ExtendedFormFieldErrors.graphQL}`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: OnboardingStep3MutationVariables): Promise<OnboardingStep3Mutation> {
    return fetchGraphQL(OnboardingStep3Mutation.graphQL, args);
  }
};

export const fetchOnboardingStep3Mutation = OnboardingStep3Mutation.fetch;