/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

/**
 * The status of the HP Action upload (document assembly) process for a user.
 */
export enum HPUploadStatus {
  ERRORED = "ERRORED",
  NOT_STARTED = "NOT_STARTED",
  STARTED = "STARTED",
  SUCCEEDED = "SUCCEEDED",
}

/**
 * An enumeration.
 */
export enum LetterRequestMailChoice {
  USER_WILL_MAIL = "USER_WILL_MAIL",
  WE_WILL_MAIL = "WE_WILL_MAIL",
}

/**
 * An enumeration.
 */
export enum OnboardingInfoSignupIntent {
  HP = "HP",
  LOC = "LOC",
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
  currencyField: string;
  subforms: SubformsExampleSubformFormSetInput[];
  clientMutationId?: string | null;
}

export interface ExampleRadioInput {
  radioField: string;
  clientMutationId?: string | null;
}

export interface GeneratePDFInput {
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
  firstName: string;
  lastName: string;
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
  signupIntent: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  agreeToTerms: boolean;
  clientMutationId?: string | null;
}

export interface PasswordResetConfirmInput {
  password: string;
  confirmPassword: string;
  clientMutationId?: string | null;
}

export interface PasswordResetInput {
  phoneNumber: string;
  clientMutationId?: string | null;
}

export interface PasswordResetVerificationCodeInput {
  code: string;
  clientMutationId?: string | null;
}

export interface SubformsExampleSubformFormSetInput {
  exampleField: string;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
