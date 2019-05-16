// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { OnboardingInfoSignupIntent, LetterRequestMailChoice, HPUploadStatus } from "./globalTypes";

// ====================================================
// GraphQL fragment: AllSessionInfo
// ====================================================

export interface AllSessionInfo_onboardingInfo {
  /**
   * The reason the user originally signed up with us.
   */
  signupIntent: OnboardingInfoSignupIntent;
}

export interface AllSessionInfo_onboardingStep1 {
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

export interface AllSessionInfo_onboardingStep2 {
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

export interface AllSessionInfo_onboardingStep3 {
  /**
   * The type of lease the user has on their dwelling.
   */
  leaseType: string;
  /**
   * Does the user receive public assistance, e.g. Section 8?
   */
  receivesPublicAssistance: boolean;
}

export interface AllSessionInfo_customIssues {
  area: string;
  description: string;
}

export interface AllSessionInfo_landlordDetails {
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

export interface AllSessionInfo_letterRequest {
  updatedAt: any;
  /**
   * How the letter of complaint will be mailed.
   */
  mailChoice: LetterRequestMailChoice;
}

export interface AllSessionInfo {
  /**
   * The ID of the currently logged-in user, or null if not logged-in.
   */
  userId: number | null;
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
  onboardingInfo: AllSessionInfo_onboardingInfo | null;
  onboardingStep1: AllSessionInfo_onboardingStep1 | null;
  onboardingStep2: AllSessionInfo_onboardingStep2 | null;
  onboardingStep3: AllSessionInfo_onboardingStep3 | null;
  issues: string[];
  customIssues: AllSessionInfo_customIssues[];
  accessDates: string[];
  landlordDetails: AllSessionInfo_landlordDetails | null;
  letterRequest: AllSessionInfo_letterRequest | null;
  /**
   * The URL of the most recently-generated HP Action PDF for the current user.
   */
  latestHpActionPdfUrl: string | null;
  /**
   * The status of the HP Action upload (document assembly) process for a user.
   */
  hpActionUploadStatus: HPUploadStatus;
}

export const graphQL = `fragment AllSessionInfo on SessionInfo {
    userId
    firstName
    lastName
    phoneNumber
    csrfToken
    isStaff
    isSafeModeEnabled
    prefersLegacyApp
    onboardingInfo {
        signupIntent
    }
    onboardingStep1 {
        firstName
        lastName
        address
        aptNumber,
        borough
    },
    onboardingStep2 {
        isInEviction
        needsRepairs
        hasNoServices
        hasPests
        hasCalled311
    }
    onboardingStep3 {
        leaseType
        receivesPublicAssistance
    }
    issues
    customIssues {
        area
        description
    }
    accessDates
    landlordDetails {
        name
        address
        isLookedUp
    }
    letterRequest {
        updatedAt
        mailChoice
    }
    latestHpActionPdfUrl,
    hpActionUploadStatus
}
`;