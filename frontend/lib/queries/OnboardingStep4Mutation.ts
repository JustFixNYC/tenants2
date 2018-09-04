// This file was automatically generated and should not be edited.

import * as AllSessionInfo from './AllSessionInfo'
/* tslint:disable */
// This file was automatically generated and should not be edited.

import { OnboardingStep4Input } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: OnboardingStep4Mutation
// ====================================================

export interface OnboardingStep4Mutation_onboardingStep4_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface OnboardingStep4Mutation_onboardingStep4_session_onboardingStep1 {
  name: string;
  address: string;
  aptNumber: string;
  borough: string;
}

export interface OnboardingStep4Mutation_onboardingStep4_session_onboardingStep2 {
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

export interface OnboardingStep4Mutation_onboardingStep4_session_onboardingStep3 {
  leaseType: string;
  /**
   * Does the user receive public assistance, e.g. Section 8?
   */
  receivesPublicAssistance: boolean;
}

export interface OnboardingStep4Mutation_onboardingStep4_session {
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
  onboardingStep1: OnboardingStep4Mutation_onboardingStep4_session_onboardingStep1 | null;
  onboardingStep2: OnboardingStep4Mutation_onboardingStep4_session_onboardingStep2 | null;
  onboardingStep3: OnboardingStep4Mutation_onboardingStep4_session_onboardingStep3 | null;
}

export interface OnboardingStep4Mutation_onboardingStep4 {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: OnboardingStep4Mutation_onboardingStep4_errors[];
  session: OnboardingStep4Mutation_onboardingStep4_session | null;
}

export interface OnboardingStep4Mutation {
  onboardingStep4: OnboardingStep4Mutation_onboardingStep4;
}

export interface OnboardingStep4MutationVariables {
  input: OnboardingStep4Input;
}

export function fetchOnboardingStep4Mutation(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: OnboardingStep4MutationVariables): Promise<OnboardingStep4Mutation> {
  // The following query was taken from OnboardingStep4Mutation.graphql.
  return fetchGraphQL(`mutation OnboardingStep4Mutation($input: OnboardingStep4Input!) {
    onboardingStep4(input: $input) {
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