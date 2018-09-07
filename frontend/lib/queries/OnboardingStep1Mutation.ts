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

export interface OnboardingStep1Mutation_onboardingStep1_session_onboardingStep2 {
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

export interface OnboardingStep1Mutation_onboardingStep1_session_onboardingStep3 {
  /**
   * The type of lease the user has on their dwelling.
   */
  leaseType: string;
  /**
   * Does the user receive public assistance, e.g. Section 8?
   */
  receivesPublicAssistance: boolean;
}

export interface OnboardingStep1Mutation_onboardingStep1_session_customIssues {
  area: string;
  description: string;
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
  onboardingStep2: OnboardingStep1Mutation_onboardingStep1_session_onboardingStep2 | null;
  onboardingStep3: OnboardingStep1Mutation_onboardingStep1_session_onboardingStep3 | null;
  issues: string[];
  customIssues: OnboardingStep1Mutation_onboardingStep1_session_customIssues[];
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