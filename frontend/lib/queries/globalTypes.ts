/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * An enumeration.
 */
export enum LetterRequestMailChoice {
  USER_WILL_MAIL = "USER_WILL_MAIL",
  WE_WILL_MAIL = "WE_WILL_MAIL",
}

export interface AccessDatesInput {
  date1: string;
  date2: string;
  date3: string;
  clientMutationId?: string | null;
}

export interface ExampleInput {
  exampleField: string;
  boolField: boolean;
  clientMutationId?: string | null;
}

export interface IssueAreaInput {
  area: string;
  issues: string[];
  other: string;
  clientMutationId?: string | null;
}

export interface LandlordDetailsInput {
  name: string;
  address: string;
  clientMutationId?: string | null;
}

export interface LetterRequestInput {
  mailChoice: string;
  clientMutationId?: string | null;
}

export interface LoginInput {
  phoneNumber: string;
  password: string;
  clientMutationId?: string | null;
}

export interface LogoutInput {
  clientMutationId?: string | null;
}

export interface OnboardingStep1Input {
  address: string;
  borough: string;
  aptNumber: string;
  name: string;
  clientMutationId?: string | null;
}

export interface OnboardingStep2Input {
  isInEviction: boolean;
  needsRepairs: boolean;
  hasNoServices: boolean;
  hasPests: boolean;
  hasCalled311: boolean;
  clientMutationId?: string | null;
}

export interface OnboardingStep3Input {
  leaseType: string;
  receivesPublicAssistance: boolean;
  clientMutationId?: string | null;
}

export interface OnboardingStep4Input {
  canWeSms: boolean;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  clientMutationId?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
