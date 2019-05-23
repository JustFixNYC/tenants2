// This file was automatically generated and should not be edited.

import * as ExtendedFormFieldErrors from './ExtendedFormFieldErrors'
import * as FeeWaiverDetails from './FeeWaiverDetails'
/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { FeeWaiverInput, FeeWaiverDetailsIncomeFrequency } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: FeeWaiverMutation
// ====================================================

export interface FeeWaiverMutation_output_errors_extendedMessages {
  /**
   * A human-readable validation error.
   */
  message: string;
  /**
   * A machine-readable representation of the error.
   */
  code: string | null;
}

export interface FeeWaiverMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of validation errors with extended metadata.
   */
  extendedMessages: FeeWaiverMutation_output_errors_extendedMessages[];
}

export interface FeeWaiverMutation_output_session_feeWaiver {
  incomeFrequency: FeeWaiverDetailsIncomeFrequency;
  incomeAmount: number;
  incomeSrcEmployment: boolean;
  incomeSrcHra: boolean;
  incomeSrcChildSupport: boolean;
  incomeSrcAlimony: boolean;
  rentAmount: number;
  expenseUtilities: boolean;
  expenseCable: boolean;
  expenseChildcare: boolean;
  expensePhone: boolean;
  askedBefore: boolean;
}

export interface FeeWaiverMutation_output_session {
  feeWaiver: FeeWaiverMutation_output_session_feeWaiver | null;
}

export interface FeeWaiverMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: FeeWaiverMutation_output_errors[];
  session: FeeWaiverMutation_output_session | null;
}

export interface FeeWaiverMutation {
  output: FeeWaiverMutation_output;
}

export interface FeeWaiverMutationVariables {
  input: FeeWaiverInput;
}

export const FeeWaiverMutation = {
  // The following query was taken from FeeWaiverMutation.graphql.
  graphQL: `mutation FeeWaiverMutation($input: FeeWaiverInput!) {
    output: feeWaiver(input: $input) {
        errors { ...ExtendedFormFieldErrors },
        session {
            feeWaiver {
                ...FeeWaiverDetails
            }
        }
    }
}

${ExtendedFormFieldErrors.graphQL}
${FeeWaiverDetails.graphQL}`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: FeeWaiverMutationVariables): Promise<FeeWaiverMutation> {
    return fetchGraphQL(FeeWaiverMutation.graphQL, args);
  }
};

export const fetchFeeWaiverMutation = FeeWaiverMutation.fetch;