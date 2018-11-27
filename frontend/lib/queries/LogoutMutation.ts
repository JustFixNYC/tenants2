// This file was automatically generated and should not be edited.

import * as AllSessionInfo from './AllSessionInfo'
/* tslint:disable */
// This file was automatically generated and should not be edited.

import { LogoutInput, OnboardingInfoSignupIntent, LetterRequestMailChoice } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: LogoutMutation
// ====================================================

export interface LogoutMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface LogoutMutation_output_session_onboardingInfo {
  /**
   * The reason the user originally signed up with us.
   */
  signupIntent: OnboardingInfoSignupIntent;
}

export interface LogoutMutation_output_session_onboardingStep1 {
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

export interface LogoutMutation_output_session_onboardingStep2 {
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

export interface LogoutMutation_output_session_onboardingStep3 {
  /**
   * The type of lease the user has on their dwelling.
   */
  leaseType: string;
  /**
   * Does the user receive public assistance, e.g. Section 8?
   */
  receivesPublicAssistance: boolean;
}

export interface LogoutMutation_output_session_customIssues {
  area: string;
  description: string;
}

export interface LogoutMutation_output_session_landlordDetails {
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

export interface LogoutMutation_output_session_letterRequest {
  updatedAt: any;
  /**
   * How the letter of complaint will be mailed.
   */
  mailChoice: LetterRequestMailChoice;
}

export interface LogoutMutation_output_session {
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
   * Whether we should redirect this user to the legacy tenant app after they log in. If null, the user is either not a legacy user, or legacy app integration is disabled.
   */
  prefersLegacyApp: boolean | null;
  /**
   * The user's onboarding details, which they filled out during the onboarding process. This is not to be confused with the individual onboarding steps, which capture information someone filled out *during* onboarding, before they became a full-fledged user.
   */
  onboardingInfo: LogoutMutation_output_session_onboardingInfo | null;
  onboardingStep1: LogoutMutation_output_session_onboardingStep1 | null;
  onboardingStep2: LogoutMutation_output_session_onboardingStep2 | null;
  onboardingStep3: LogoutMutation_output_session_onboardingStep3 | null;
  issues: string[];
  customIssues: LogoutMutation_output_session_customIssues[];
  accessDates: string[];
  landlordDetails: LogoutMutation_output_session_landlordDetails | null;
  letterRequest: LogoutMutation_output_session_letterRequest | null;
}

export interface LogoutMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: LogoutMutation_output_errors[];
  session: LogoutMutation_output_session;
}

export interface LogoutMutation {
  output: LogoutMutation_output;
}

export interface LogoutMutationVariables {
  input: LogoutInput;
}

export const LogoutMutation = {
  // The following query was taken from LogoutMutation.graphql.
  graphQL: `mutation LogoutMutation($input: LogoutInput!) {
    output: logout(input: $input) {
        errors {
            field,
            messages
        }
        session {
            ...AllSessionInfo
        }
    }
}

${AllSessionInfo.graphQL}`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: LogoutMutationVariables): Promise<LogoutMutation> {
    return fetchGraphQL(LogoutMutation.graphQL, args);
  }
};

export const fetchLogoutMutation = LogoutMutation.fetch;