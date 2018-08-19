import React from 'react';

/**
 * These are Graphene-Django's extremely complicated form validation error types.
 */
interface GrapheneDjangoFormFieldError {
  field: string | null;
  messages: (string | null)[] | null;
}

type GrapheneDjangoFormErrors = (GrapheneDjangoFormFieldError | null)[] | null;

/**
 * These are our much simpler form validation error types.
 */
interface FormFieldError {
  field: string;
  messages: string[];
}

// This type is parameterized by the form input, so that each
// key corresponds to the name of a form input field. In practice,
// this might be hard to achieve, so we'll default the parameter to "any".
export type FormFieldErrorMap<T = any> = {
  [K in keyof T]?: string[];
}

export interface FormErrors {
  /**
   * Non-field errors that don't correspond to any particular field.
   */
  nonFieldErrors: string[];

  /**
   * Field-specific errors.
   */
  fieldErrors: FormFieldErrorMap;
}

/**
 * Graphene-Django's forms error typing is rife with nullable types that, in
 * practice, should never actually be null. I'm not sure if this is
 * a bug in Graphene-Django's form handling, or a misconception on my part,
 * but for now this function converts Django-Graphene's errors to a
 * simpler type that we can work more easily with. It also raises
 * assertion errors if any of our assumptions prove wrong at runtime.
 * 
 * @param errors Raw errors given to us from Graphene-Django's GraphQL response.
 *   It is assumed that there is at least one error in this list.
 */
function simplifyErrors(errors: GrapheneDjangoFormErrors): FormFieldError[] {
  if (!errors || errors.length === 0) {
    throw new Error('Assertion failure, errors should be a non-empty array');
  }

  return errors.map(error => {
    if (!error || !error.field || !error.messages) {
      throw new Error('Assertion failure, error should have non-empty field and messages');
    }
    return {
      field: error.field,
      messages: error.messages.map(message => {
        if (!message) {
          throw new Error("Assertion failure, message should be non-empty");
        }
        return message;
      })
    };
  });
}

/**
 * Re-structure a list of simplified errors into a more convenient format for us to process.
 * 
 * @param errors A list of simplified errors.
 */
function createFormErrors(errors: FormFieldError[]): FormErrors {
  const result: FormErrors = {
    nonFieldErrors: [],
    fieldErrors: {}
  };

  errors.forEach(error => {
    if (error.field === '__all__') {
      result.nonFieldErrors.push(...error.messages);
    } else {
      const fieldErrors = result.fieldErrors[error.field] || [];
      fieldErrors.push(...error.messages);
      result.fieldErrors[error.field] = fieldErrors;
    }
  });

  return result;
}

/** Convert a list of Graphene-Django's form errors into a more manageable form. */
export function getFormErrors(errors: GrapheneDjangoFormErrors): FormErrors {
  return createFormErrors(simplifyErrors(errors));
}

/** A simple JSX component that displays some errors. */
export function ListFieldErrors({ errors }: { errors: string[]|undefined }): JSX.Element|null {
  if (!errors) {
    return null;
  }

  return (
    <ul>
      {errors.map(error => <li key={error}>{error}</li>)}
    </ul>
  );
}
