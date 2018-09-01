import React from 'react';

/** The server uses this as the field "name" for non-field errors. */
const SERVER_NON_FIELD_ERROR = '__all__';

/**
 * This is the form validation error type returned from the server.
 */
export interface ServerFormFieldError {
  field: string;
  messages: string[];
}

/**
 * Any form validation done by the server will return an object that
 * looks like this.
 */
export type WithServerFormFieldErrors = {
  errors: ServerFormFieldError[];
};

// This type is parameterized by the form input, so that each
// key corresponds to the name of a form input field.
export type FormFieldErrorMap<T> = {
  [K in keyof T]?: string[];
}

export interface FormErrors<T> {
  /**
   * Non-field errors that don't correspond to any particular field.
   */
  nonFieldErrors: string[];

  /**
   * Field-specific errors.
   */
  fieldErrors: FormFieldErrorMap<T>;
}

/**
 * Re-structure a list of errors from the server into a more convenient
 * format for us to process.
 * 
 * @param errors A list of errors from the server.
 */
export function getFormErrors<T>(errors: ServerFormFieldError[]): FormErrors<T> {
  const result: FormErrors<T> = {
    nonFieldErrors: [],
    fieldErrors: {}
  };

  errors.forEach(error => {
    if (error.field === SERVER_NON_FIELD_ERROR) {
      result.nonFieldErrors.push(...error.messages);
    } else {
      // Note that we're forcing a typecast here. It's not ideal, but
      // it seems better than the alternative of not parameterizing
      // this type at all.
      const field: keyof T = error.field as any;

      // This code looks weird because TypeScript is being fidgety.
      const arr = result.fieldErrors[field];
      if (arr) {
        arr.push(...error.messages);
      } else {
        result.fieldErrors[field] = [...error.messages];
      }
    }
  });

  return result;
}

/** A JSX component that displays non-field errors. */
export function NonFieldErrors(props: { errors?: FormErrors<any> }): JSX.Element|null {
  const errors = props.errors && props.errors.nonFieldErrors;

  if (!errors) {
    return null;
  }

  return (
    <React.Fragment>
      {errors.map(error => <div className="notification is-danger" key={error}>{error}</div>)}
    </React.Fragment>
  );
}

type ObjWithErrors = { errors?: string[] };

/**
 * Combine multiple errors into a single string and return it.
 * 
 * Also, if we're provided with a label, construct an ARIA label
 * consisting of the original label followed by the errors (there's
 * dispute on what the best way to present form validation errors
 * to screen readers is, and this approach seems to work).
 */
export function formatErrors(props: ObjWithErrors & { label: string }): {
  errorHelp: JSX.Element|null,
  ariaLabel: string
};

export function formatErrors(props: ObjWithErrors): {
  errorHelp: JSX.Element|null,
};

export function formatErrors(props: ObjWithErrors & { label?: string }): {
  errorHelp: JSX.Element|null,
  ariaLabel?: string
} {
  let ariaLabel = props.label;
  let errorHelp = null;

  if (props.errors) {
    const allErrors = props.errors.join(', ');
    errorHelp = <p className="help is-danger">{allErrors}</p>;
    if (props.label !== undefined) {
      ariaLabel = `${ariaLabel}, ${allErrors}`;
    }
  }

  return { errorHelp, ariaLabel };
}
