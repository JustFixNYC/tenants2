// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { GeneratePDFInput, HPUploadStatus } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: GenerateHPActionPDF
// ====================================================

export interface GenerateHPActionPDF_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface GenerateHPActionPDF_output_session {
  /**
   * The URL of the most recently-generated HP Action PDF for the current user.
   */
  latestHpActionPdfUrl: string | null;
  /**
   * The status of the HP Action upload (document assembly) process for a user.
   */
  hpActionUploadStatus: HPUploadStatus;
}

export interface GenerateHPActionPDF_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: GenerateHPActionPDF_output_errors[];
  session: GenerateHPActionPDF_output_session | null;
}

export interface GenerateHPActionPDF {
  output: GenerateHPActionPDF_output;
}

export interface GenerateHPActionPDFVariables {
  input: GeneratePDFInput;
}

export const GenerateHPActionPDF = {
  // The following query was taken from GenerateHPActionPDF.graphql.
  graphQL: `mutation GenerateHPActionPDF($input: GeneratePDFInput!) {
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
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: GenerateHPActionPDFVariables): Promise<GenerateHPActionPDF> {
    return fetchGraphQL(GenerateHPActionPDF.graphQL, args);
  }
};

export const fetchGenerateHPActionPDF = GenerateHPActionPDF.fetch;