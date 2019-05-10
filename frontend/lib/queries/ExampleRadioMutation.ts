// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { ExampleRadioInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ExampleRadioMutation
// ====================================================

export interface ExampleRadioMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
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
        errors {
            field,
            messages
        }
        response
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: ExampleRadioMutationVariables): Promise<ExampleRadioMutation> {
    return fetchGraphQL(ExampleRadioMutation.graphQL, args);
  }
};

export const fetchExampleRadioMutation = ExampleRadioMutation.fetch;