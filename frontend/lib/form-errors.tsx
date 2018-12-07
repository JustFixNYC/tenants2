import React from 'react';
import { ga } from './google-analytics';

/** The server uses this as the field "name" for non-field errors. */
const SERVER_NON_FIELD_ERROR = '__all__';

/**
 * This is the form validation error type returned from the server.
 */
export interface ServerFormFieldError {
  field: string;
  messages: string[];
}

export interface ServerFormsetErrors {
  nonFormErrors: string[];
  formErrors: ServerFormFieldError[][];
}

export type ServerFormFieldErrorCollection = {
  fieldErrors: ServerFormFieldError[];
};

export type NamespacedServerFormError = {
  name: string;
  errors: ServerFormFieldErrorCollection|ServerFormsetErrors
};

export type NamespacedServerFormErrorCollection = {
  errorCount: number;
  namespaces: NamespacedServerFormError[];
};

/**
 * Any form validation done by the server will return an object that
 * looks like this.
 */
export type WithServerFormFieldErrors = {
  errors: ServerFormFieldError[]|NamespacedServerFormErrorCollection;
};

// This type is parameterized by the form input, so that each
// key corresponds to the name of a form input field.
export type FormFieldErrorMap<T> = {
  [K in keyof T]?: string[];
}

export interface FormsetErrors<T> {
  nonFormErrors: string[];
  formErrors: FormErrors<T>[];
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

export type NamespacedFormErrorMap<FormInput> = {
  [K in keyof FormInput]: FormInput[K] extends (infer U)[]
                          ? FormsetErrors<U>
                          : FormErrors<FormInput[K]>;
} & {
  errorCount: number
};

export type FormlikeErrors<T> = NamespacedFormErrorMap<T>|FormErrors<T>;

/**
 * Log errors from the server to Google Analytics.
 */
export function trackFormErrors(errors: ServerFormFieldError[]): void {
  for (let error of errors) {
    for (let message of error.messages) {
      ga('send', 'event', 'form-error', error.field, message);
    }
  }
}

export function areServerFormErrorsEmpty(target: WithServerFormFieldErrors): boolean {
  const { errors } = target;

  return Array.isArray(errors) ? errors.length === 0 : errors.errorCount === 0;
}

export function getFormlikeErrors<T>(target: WithServerFormFieldErrors): FormlikeErrors<T> {
  const { errors } = target;

  if (Array.isArray(errors)) {
    return getFormFieldErrors(errors);
  }

  const result = {
    errorCount: errors.errorCount
  } as NamespacedFormErrorMap<T>;

  errors.namespaces.forEach(ns => {
    let value;
    if ('fieldErrors' in ns.errors) {
      value = getFormFieldErrors(ns.errors.fieldErrors);
    } else {
      const errors: FormsetErrors<any> = {
        nonFormErrors: ns.errors.nonFormErrors,
        formErrors: ns.errors.formErrors.map(item => getFormFieldErrors(item))
      };
      value = errors;
    }
    (result as NamespacedFormErrorMap<any>)[ns.name] = value;
  });

  return result;
}

/**
 * Re-structure a list of errors from the server into a more convenient
 * format for us to process.
 * 
 * @param errors A list of errors from the server.
 */
export function getFormFieldErrors<T>(errors: ServerFormFieldError[]): FormErrors<T> {
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

function errorsToDivs(errors?: string[]): JSX.Element|null {
  if (!errors) return null;
  return <>{errors.map(error => <div className="notification is-danger" key={error}>{error}</div>)}</>;
}

export function NonFormErrors(props: { errors?: FormsetErrors<any> }): JSX.Element|null {
  return errorsToDivs(props.errors && props.errors.nonFormErrors);
}

/** A JSX component that displays non-field errors. */
export function NonFieldErrors(props: { errors?: FormErrors<any> }): JSX.Element|null {
  return errorsToDivs(props.errors && props.errors.nonFieldErrors);
}

/** An object that potentially has form field errors associated with it. */
export type WithFormFieldErrors = {
  /**
   * This should either be undefined, or an array with one or more elements.
   * It should never be an empty array.
   */
  errors?: string[];
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
