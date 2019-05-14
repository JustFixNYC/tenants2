// This file was automatically generated and should not be edited.

import * as ExtendedFormFieldErrors from './ExtendedFormFieldErrors'
/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

import { IssueAreaInput } from "./globalTypes";

// ====================================================
// GraphQL mutation operation: IssueAreaMutation
// ====================================================

export interface IssueAreaMutation_output_errors_extendedMessages {
  /**
   * A human-readable validation error.
   */
  message: string;
  /**
   * A machine-readable representation of the error.
   */
  code: string | null;
}

export interface IssueAreaMutation_output_errors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of validation errors with extended metadata.
   */
  extendedMessages: IssueAreaMutation_output_errors_extendedMessages[];
}

export interface IssueAreaMutation_output_session_customIssues {
  area: string;
  description: string;
}

export interface IssueAreaMutation_output_session {
  issues: string[];
  customIssues: IssueAreaMutation_output_session_customIssues[];
}

export interface IssueAreaMutation_output {
  /**
   * A list of validation errors in the form, if any. If the form was valid, this list will be empty.
   */
  errors: IssueAreaMutation_output_errors[];
  session: IssueAreaMutation_output_session | null;
}

export interface IssueAreaMutation {
  output: IssueAreaMutation_output;
}

export interface IssueAreaMutationVariables {
  input: IssueAreaInput;
}

export const IssueAreaMutation = {
  // The following query was taken from IssueAreaMutation.graphql.
  graphQL: `mutation IssueAreaMutation($input: IssueAreaInput!) {
  output: issueArea(input: $input) {
    errors { ...ExtendedFormFieldErrors },
    session {
      issues
      customIssues {
          area
          description
      }
    }
  }
}

${ExtendedFormFieldErrors.graphQL}`,
  fetch(fetchGraphQL: (query: string, args?: any) => Promise<any>, args: IssueAreaMutationVariables): Promise<IssueAreaMutation> {
    return fetchGraphQL(IssueAreaMutation.graphQL, args);
  }
};

export const fetchIssueAreaMutation = IssueAreaMutation.fetch;