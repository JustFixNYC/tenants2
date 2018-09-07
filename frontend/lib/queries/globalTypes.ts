/* tslint:disable */
// This file was automatically generated and should not be edited.

//==============================================================
// START Enums and Input Objects
//==============================================================

export interface IssueAreaInput {
  area: string;
  issues: string[];
  other: string;
  clientMutationId?: string | null;
}

export interface LoginInput {
  phoneNumber: string;
  password: string;
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
  clientMutationId?: string | null;
}

//==============================================================
// END Enums and Input Objects
//==============================================================
