// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { ExamplesInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ExamplesMutation
// ====================================================

export interface ExamplesMutation_output_errors_formErrors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface ExamplesMutation_output_errors {
  nonFormErrors: string[];
  formErrors: ExamplesMutation_output_errors_formErrors[][];
}

export interface ExamplesMutation_output {
  errors: ExamplesMutation_output_errors;
  response: string | null;
}

export interface ExamplesMutation {
  output: ExamplesMutation_output;
}

export interface ExamplesMutationVariables {
  input: ExamplesInput;
}

export const ExamplesMutation = {
  // The following query was taken from ExamplesMutation.graphql.
  graphQL: `mutation ExamplesMutation($input: ExamplesInput!) {
    output: examples(input: $input) {
        errors {
            nonFormErrors
            formErrors {
                field
                messages
            }
        },
        response
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: ExamplesMutationVariables): Promise<ExamplesMutation> {
    return fetchGraphQL(ExamplesMutation.graphQL, args);
  }
};

export const fetchExamplesMutation = ExamplesMutation.fetch;