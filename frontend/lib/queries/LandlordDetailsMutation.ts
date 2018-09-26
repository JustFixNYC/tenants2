// This file was automatically generated and should not be edited.

/* tslint:disable */
// This file was automatically generated and should not be edited.

import { LandlordDetailsInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: LandlordDetailsMutation
// ====================================================

export interface LandlordDetailsMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of human-readable validation errors.
   */
  messages: string[];
}

export interface LandlordDetailsMutation_output_session_landlordDetails {
  /**
   * The landlord's name.
   */
  name: string;
  /**
   * The full mailing address for the landlord.
   */
  address: string;
  /**
   * Whether the name and address was looked up automatically, or manually entered by the user.
   */
  isLookedUp: boolean;
}

export interface LandlordDetailsMutation_output_session {
  landlordDetails: LandlordDetailsMutation_output_session_landlordDetails | null;
}

export interface LandlordDetailsMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: LandlordDetailsMutation_output_errors[];
  session: LandlordDetailsMutation_output_session | null;
}

export interface LandlordDetailsMutation {
  output: LandlordDetailsMutation_output;
}

export interface LandlordDetailsMutationVariables {
  input: LandlordDetailsInput;
}

export const LandlordDetailsMutation = {
  // The following query was taken from LandlordDetailsMutation.graphql.
  graphQL: `mutation LandlordDetailsMutation($input: LandlordDetailsInput!) {
    output: landlordDetails(input: $input) {
        errors {
            field,
            messages
        },
        session {
            landlordDetails {
                name
                address
                isLookedUp
            }
        }
    }
}
`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: LandlordDetailsMutationVariables): Promise<LandlordDetailsMutation> {
    return fetchGraphQL(LandlordDetailsMutation.graphQL, args);
  }
};

export const fetchLandlordDetailsMutation = LandlordDetailsMutation.fetch;