// This file was automatically generated and should not be edited.

import * as ExtendedFormFieldErrors from './ExtendedFormFieldErrors'
/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { ExampleRadioInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ExampleRadioMutation
// ====================================================

export interface ExampleRadioMutation_output_errors_extendedMessages {
  /**
   * A human-readable validation error.
   */
  message: string;
  /**
   * A machine-readable representation of the error.
   */
  code: string | null;
}

export interface ExampleRadioMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of validation errors with extended metadata.
   */
  extendedMessages: ExampleRadioMutation_output_errors_extendedMessages[];
}

export interface ExampleRadioMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: ExampleRadioMutation_output_errors[];
  response: string | null;
}

export interface ExampleRadioMutation {
  output: ExampleRadioMutation_output;
}

export interface ExampleRadioMutationVariables {
  input: ExampleRadioInput;
}

export const ExampleRadioMutation = {
  // The following query was taken from ExampleRadioMutation.graphql.
  graphQL: `mutation ExampleRadioMutation($input: ExampleRadioInput!) {
    output: exampleRadio(input: $input) {
        errors { ...ExtendedFormFieldErrors },
        response
    }
}

${ExtendedFormFieldErrors.graphQL}`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: ExampleRadioMutationVariables): Promise<ExampleRadioMutation> {
    return fetchGraphQL(ExampleRadioMutation.graphQL, args);
  }
};

export const fetchExampleRadioMutation = ExampleRadioMutation.fetch;