// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { ExampleInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ExampleMutation
// ====================================================

export interface ExampleMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface ExampleMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: ExampleMutation_output_errors[];
  response: string | null;
}

export interface ExampleMutation {
  output: ExampleMutation_output;
}

export interface ExampleMutationVariables {
  input: ExampleInput;
}

export const ExampleMutation = {
  // The following query was taken from ExampleMutation.graphql.
  graphQL: `mutation ExampleMutation($input: ExampleInput!) {
    output: example(input: $input) {
        errors {
            field,
            messages
        },
        response
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: ExampleMutationVariables): Promise<ExampleMutation> {
    return fetchGraphQL(ExampleMutation.graphQL, args);
  }
};

export const fetchExampleMutation = ExampleMutation.fetch;