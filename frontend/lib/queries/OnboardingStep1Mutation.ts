// This file was automatically generated and should not be edited.

import * as AllSessionInfo from './AllSessionInfo'
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

export interface OnboardingStep1Mutation_onboardingStep1_session_onboardingStep1 {
  name: string;
  address: string;
  aptNumber: string;
}

export interface OnboardingStep1Mutation_onboardingStep1_session {
  /**
   * The phone number of the currently logged-in user, or null if not logged-in.
   */
  phoneNumber: string | null;
  /**
   * The cross-site request forgery (CSRF) token.
   */
  csrfToken: string;
  /**
   * Whether or not the currently logged-in user is a staff member.
   */
  isStaff: boolean;
  onboardingStep1: OnboardingStep1Mutation_onboardingStep1_session_onboardingStep1 | null;
}

export interface OnboardingStep1Mutation_onboardingStep1 {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: OnboardingStep1Mutation_onboardingStep1_errors[];
  session: OnboardingStep1Mutation_onboardingStep1_session | null;
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
        },
        session {
            ...AllSessionInfo
        }
    }
}

${AllSessionInfo.graphQL}`, args);
}