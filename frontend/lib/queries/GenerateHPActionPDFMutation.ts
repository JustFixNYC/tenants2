// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { GeneratePDFInput, HPUploadStatus } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: GenerateHPActionPDFMutation
// ====================================================

export interface GenerateHPActionPDFMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface GenerateHPActionPDFMutation_output_session {
  /**
   * The URL of the most recently-generated HP Action PDF for the current user.
   */
  latestHpActionPdfUrl: string | null;
  /**
   * The status of the HP Action upload (document assembly) process for a user.
   */
  hpActionUploadStatus: HPUploadStatus;
}

export interface GenerateHPActionPDFMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: GenerateHPActionPDFMutation_output_errors[];
  session: GenerateHPActionPDFMutation_output_session | null;
}

export interface GenerateHPActionPDFMutation {
  output: GenerateHPActionPDFMutation_output;
}

export interface GenerateHPActionPDFMutationVariables {
  input: GeneratePDFInput;
}

export const GenerateHPActionPDFMutation = {
  // The following query was taken from GenerateHPActionPDFMutation.graphql.
  graphQL: `mutation GenerateHPActionPDFMutation($input: GeneratePDFInput!) {
    output: generateHpActionPdf(input: $input) {
        errors {
            field,
            messages
        }
        session {
            latestHpActionPdfUrl,
            hpActionUploadStatus
        }
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: GenerateHPActionPDFMutationVariables): Promise<GenerateHPActionPDFMutation> {
    return fetchGraphQL(GenerateHPActionPDFMutation.graphQL, args);
  }
};

export const fetchGenerateHPActionPDFMutation = GenerateHPActionPDFMutation.fetch;