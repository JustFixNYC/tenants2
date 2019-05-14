// This file was automatically generated and should not be edited.

import * as ExtendedFormFieldErrors from './ExtendedFormFieldErrors'
/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { OnboardingStep1Input } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: OnboardingStep1Mutation
// ====================================================

export interface OnboardingStep1Mutation_output_errors_extendedMessages {
  /**
   * A human-readable validation error.
   */
  message: string;
  /**
   * A machine-readable representation of the error.
   */
  code: string | null;
}

export interface OnboardingStep1Mutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of validation errors with extended metadata.
   */
  extendedMessages: OnboardingStep1Mutation_output_errors_extendedMessages[];
}

export interface OnboardingStep1Mutation_output_session_onboardingStep1 {
  firstName: string;
  lastName: string;
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
        errors { ...ExtendedFormFieldErrors },
        session {
            onboardingStep1 {
                firstName,
                lastName,
                address,
                aptNumber,
                borough
            }
        }
    }
}

${ExtendedFormFieldErrors.graphQL}`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: OnboardingStep1MutationVariables): Promise<OnboardingStep1Mutation> {
    return fetchGraphQL(OnboardingStep1Mutation.graphQL, args);
  }
};

export const fetchOnboardingStep1Mutation = OnboardingStep1Mutation.fetch;