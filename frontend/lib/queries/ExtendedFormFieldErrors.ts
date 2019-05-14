// This file was automatically generated and should not be edited.

/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: ExtendedFormFieldErrors
// ====================================================

export interface ExtendedFormFieldErrors_extendedMessages {
  /**
   * A human-readable validation error.
   */
  message: string;
  /**
   * A machine-readable representation of the error.
   */
  code: string | null;
}

export interface ExtendedFormFieldErrors {
  /**
   * The camel-cased name of the input field, or '__all__' for non-field errors.
   */
  field: string;
  /**
   * A list of validation errors with extended metadata.
   */
  extendedMessages: ExtendedFormFieldErrors_extendedMessages[];
}

export const graphQL = `fragment ExtendedFormFieldErrors on StrictFormFieldErrorType {
    field,
    extendedMessages {
        message,
        code
    }
}
`;