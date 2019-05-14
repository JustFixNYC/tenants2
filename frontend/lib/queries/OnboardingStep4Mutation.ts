// This file was automatically generated and should not be edited.

import * as ExtendedFormFieldErrors from './ExtendedFormFieldErrors'
import * as AllSessionInfo from './AllSessionInfo'
/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { OnboardingStep4Input, OnboardingInfoSignupIntent, LetterRequestMailChoice, HPUploadStatus } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: OnboardingStep4Mutation
// ====================================================

export interface OnboardingStep4Mutation_output_errors_extendedMessages {
  /**
   * A human-readable validation error.
   */
  message: string;
  /**
   * A machine-readable representation of the error.
   */
  code: string | null;
}

export interface OnboardingStep4Mutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of validation errors with extended metadata.
   */
  extendedMessages: OnboardingStep4Mutation_output_errors_extendedMessages[];
}

export interface OnboardingStep4Mutation_output_session_onboardingInfo {
  /**
   * The reason the user originally signed up with us.
   */
  signupIntent: OnboardingInfoSignupIntent;
}

export interface OnboardingStep4Mutation_output_session_onboardingStep1 {
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

export interface OnboardingStep4Mutation_output_session_onboardingStep2 {
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

export interface OnboardingStep4Mutation_output_session_onboardingStep3 {
  /**
   * The type of lease the user has on their dwelling.
   */
  leaseType: string;
  /**
   * Does the user receive public assistance, e.g. Section 8?
   */
  receivesPublicAssistance: boolean;
}

export interface OnboardingStep4Mutation_output_session_customIssues {
  area: string;
  description: string;
}

export interface OnboardingStep4Mutation_output_session_landlordDetails {
  /**
   * The landlord's name.
   */
  name: string;
  /**
   * The full mailing address for the landlord.
   */
  address: string;
  /**
   * Whether the name and address was looked up automatically, or manually entered by the user.
   */
  isLookedUp: boolean;
}

export interface OnboardingStep4Mutation_output_session_letterRequest {
  updatedAt: any;
  /**
   * How the letter of complaint will be mailed.
   */
  mailChoice: LetterRequestMailChoice;
}

export interface OnboardingStep4Mutation_output_session {
  /**
   * The first name of the currently logged-in user, or null if not logged-in.
   */
  firstName: string | null;
  /**
   * The last name of the currently logged-in user, or null if not logged-in.
   */
  lastName: string | null;
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
  /**
   * Whether or not the current session has safe/compatibility mode compatibility mode) enabled.
   */
  isSafeModeEnabled: boolean;
  /**
   * Whether we should redirect this user to the legacy tenant app after they log
   * in. If null, the user is either not a legacy user, or legacy app integration is disabled.
   */
  prefersLegacyApp: boolean | null;
  /**
   * The user's onboarding details, which they filled out during the onboarding
   * process. This is not to be confused with the individual onboarding steps,
   * which capture information someone filled out *during* onboarding, before they
   * became a full-fledged user.
   */
  onboardingInfo: OnboardingStep4Mutation_output_session_onboardingInfo | null;
  onboardingStep1: OnboardingStep4Mutation_output_session_onboardingStep1 | null;
  onboardingStep2: OnboardingStep4Mutation_output_session_onboardingStep2 | null;
  onboardingStep3: OnboardingStep4Mutation_output_session_onboardingStep3 | null;
  issues: string[];
  customIssues: OnboardingStep4Mutation_output_session_customIssues[];
  accessDates: string[];
  landlordDetails: OnboardingStep4Mutation_output_session_landlordDetails | null;
  letterRequest: OnboardingStep4Mutation_output_session_letterRequest | null;
  /**
   * The URL of the most recently-generated HP Action PDF for the current user.
   */
  latestHpActionPdfUrl: string | null;
  /**
   * The status of the HP Action upload (document assembly) process for a user.
   */
  hpActionUploadStatus: HPUploadStatus;
}

export interface OnboardingStep4Mutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: OnboardingStep4Mutation_output_errors[];
  session: OnboardingStep4Mutation_output_session | null;
}

export interface OnboardingStep4Mutation {
  output: OnboardingStep4Mutation_output;
}

export interface OnboardingStep4MutationVariables {
  input: OnboardingStep4Input;
}

export const OnboardingStep4Mutation = {
  // The following query was taken from OnboardingStep4Mutation.graphql.
  graphQL: `mutation OnboardingStep4Mutation($input: OnboardingStep4Input!) {
    output: onboardingStep4(input: $input) {
        errors { ...ExtendedFormFieldErrors },
        session {
            ...AllSessionInfo
        }
    }
}

${ExtendedFormFieldErrors.graphQL}
${AllSessionInfo.graphQL}`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: OnboardingStep4MutationVariables): Promise<OnboardingStep4Mutation> {
    return fetchGraphQL(OnboardingStep4Mutation.graphQL, args);
  }
};

export const fetchOnboardingStep4Mutation = OnboardingStep4Mutation.fetch;