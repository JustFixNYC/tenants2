// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { ExamplesInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: ExamplesMutation
// ====================================================

export interface ExamplesMutation_output_errors_namespaces_errors_FormsetErrorType_formErrors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface ExamplesMutation_output_errors_namespaces_errors_FormsetErrorType {
  nonFormErrors: string[];
  formErrors: ExamplesMutation_output_errors_namespaces_errors_FormsetErrorType_formErrors[][];
}

export interface ExamplesMutation_output_errors_namespaces_errors_FormFieldErrorCollection_fieldErrors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface ExamplesMutation_output_errors_namespaces_errors_FormFieldErrorCollection {
  fieldErrors: ExamplesMutation_output_errors_namespaces_errors_FormFieldErrorCollection_fieldErrors[];
}

export type ExamplesMutation_output_errors_namespaces_errors = ExamplesMutation_output_errors_namespaces_errors_FormsetErrorType | ExamplesMutation_output_errors_namespaces_errors_FormFieldErrorCollection;

export interface ExamplesMutation_output_errors_namespaces {
  name: string;
  errors: ExamplesMutation_output_errors_namespaces_errors;
}

export interface ExamplesMutation_output_errors {
  errorCount: number;
  namespaces: ExamplesMutation_output_errors_namespaces[];
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
            errorCount
            namespaces {
                name
                errors {
                    ... on FormsetErrorType {
                        nonFormErrors
                        formErrors {
                            field
                            messages
                        }
                    }
                    ... on FormFieldErrorCollection {
                        fieldErrors {
                            field
                            messages
                        }
                    }
                }
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