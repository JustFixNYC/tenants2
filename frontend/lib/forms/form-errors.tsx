import React from 'react';
import { ga } from '../analytics/google-analytics';

/** The server uses this as the field "name" for non-field errors. */
const SERVER_NON_FIELD_ERROR = '__all__';

/**
 * This is the extended, new-style form validation error returned
 * by the server. Aside from the human-readable error message to
 * display, additional machine-readable information is communicated.
 */
export interface ServerFormFieldError {
  field: string;
  extendedMessages: {
    message: string,
    code: string|null
  }[]
}

/**
 * Any form validation done by the server will return an object that
 * looks like this.
 */
export type WithServerFormFieldErrors = {
  errors: ServerFormFieldError[];
};

/**
 * Normalized representation of a form validation error.
 */
export class FormError {
  /**
   * TypeScript doesn't seem to distinguish between an object
   * with the "shape" of a FormError vs. an actual instance of it,
   * so we'll add this sentinel to manually ensure it.
   */
  _type = 'FormError';

  constructor(readonly message: string, readonly code: string|null = null) {
  }

  /** The human-readable representation of the error. */
  toString(): string {
    return this.message;
  }
};

// This type is parameterized by the form input, so that each
// key corresponds to the name of a form input field.
export type FormFieldErrorMap<T> = {
  [K in keyof T]?: FormError[];
}

export type FormsetErrorMap<T> = {
  [K in keyof T]?: T[K] extends Array<infer U> ? FormErrors<U>[] : never;
}

export interface FormErrors<T> {
  /**
   * Non-field errors that don't correspond to any particular field.
   */
  nonFieldErrors: FormError[];

  /**
   * Field-specific errors.
   */
  fieldErrors: FormFieldErrorMap<T>;

  /**
   * Errors pertaining to nested formsets.
   */
  formsetErrors?: FormsetErrorMap<T>;
}

/**
 * Log errors from the server to Google Analytics.
 */
export function trackFormErrors(errors: ServerFormFieldError[]): void {
  for (let error of errors) {
    for (let fe of toFormErrors(error)) {
      ga('send', 'event', 'form-error', error.field, fe.message);
    }
  }
}

const FORMSET_FIELD_RE = /^(\w+)\.(\d+)\.(\w+)$/;

type FormsetField = {
  formset: string;
  index: number;
  field: string;
};

/**
 * Parse a field name of the form "<formset>.<index>.<field>", e.g.
 * "people.0.firstName", and return the structured data.
 */
export function parseFormsetField(field: string): FormsetField|null {
  const match = field.match(FORMSET_FIELD_RE);

  if (!match) return null;

  return {
    formset: match[1],
    index: parseInt(match[2]),
    field: match[3]
  };
}

/**
 * Given a hash of formset errors, parse the given server-side
 * error and, if it's a formset error, add it to the hash and
 * return true. Otherwise, return false.
 */
export function addToFormsetErrors(errors: { [formset: string]: FormErrors<any>[]|undefined }, error: ServerFormFieldError): boolean {
  const ff = parseFormsetField(error.field);

  if (!ff) return false;

  let formsetErrors = errors[ff.formset];

  if (!formsetErrors) {
    formsetErrors = [];
    errors[ff.formset] = formsetErrors;
  }

  const result = getFormErrors([
    { ...error, field: ff.field }
  ], formsetErrors[ff.index]);

  formsetErrors[ff.index] = result;

  return true;
}

export function strToFormError(message: string): FormError {
  return new FormError(message);
}

export function toFormErrors(errors: ServerFormFieldError): FormError[] {
  return errors.extendedMessages.map(em => new FormError(em.message, em.code));
}

/**
 * Re-structure a list of errors from the server into a more convenient
 * format for us to process.
 * 
 * @param errors A list of errors from the server.
 */
export function getFormErrors<T>(errors: ServerFormFieldError[], result: FormErrors<T> = {
  nonFieldErrors: [],
  fieldErrors: {}
}): FormErrors<T> {
  const formsetErrors: { [formset: string]: FormErrors<any>[]|undefined } = {};

  errors.forEach(error => {
    if (error.field === SERVER_NON_FIELD_ERROR) {
      result.nonFieldErrors.push(...toFormErrors(error));
    } else {
      // Note that we're forcing a few typecasts here. It's not ideal, but
      // it seems better than the alternative of not parameterizing
      // our types at all.

      if (addToFormsetErrors(formsetErrors, error)) {
        result.formsetErrors = formsetErrors as FormsetErrorMap<any>;
        return;
      }

      const field = error.field as keyof T;

      // This code looks weird because TypeScript is being fidgety.
      const arr = result.fieldErrors[field];
      if (arr) {
        arr.push(...toFormErrors(error));
      } else {
        result.fieldErrors[field] = [...toFormErrors(error)];
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
      {errors.map(error => <div className="notification is-danger" key={error.message}>{error.message}</div>)}
    </React.Fragment>
  );
}

/** An object that potentially has form field errors associated with it. */
export type WithFormFieldErrors = {
  /**
   * This should either be undefined, or an array with one or more elements.
   * It should never be an empty array.
   */
  errors?: FormError[];
};

/**
 * Combine multiple errors into a single string and return it.
 * 
 * Also, if we're provided with a label, construct an ARIA label
 * consisting of the original label followed by the errors (there's
 * dispute on what the best way to present form validation errors
 * to screen readers is, and this approach seems to work).
 */
export function formatErrors(props: WithFormFieldErrors & { label: string }): {
  errorHelp: JSX.Element|null,
  ariaLabel: string
};

export function formatErrors(props: WithFormFieldErrors): {
  errorHelp: JSX.Element|null,
};

export function formatErrors(props: WithFormFieldErrors & { label?: string }): {
  errorHelp: JSX.Element|null,
  ariaLabel?: string
} {
  let ariaLabel = props.label;
  let errorHelp = null;

  if (props.errors) {
    // We expect each error to be a sentence, so we'll join
    // them with whitespace.
    const allErrors = props.errors.join(' ');
    errorHelp = <p className="help is-danger">{allErrors}</p>;
    if (props.label !== undefined) {
      ariaLabel = `${ariaLabel}, ${allErrors}`;
    }
  }

  return { errorHelp, ariaLabel };
}
