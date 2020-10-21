import { FormFieldErrorMap, FormErrors, FormError } from "./form-errors";

/**
 * A utility type that widens any of its keys that
 * are string-like (e.g. `"yes"|"no"`) into regular strings.
 */
export type UnvalidatedInput<T> = {
  [k in keyof T]: T[k] extends string ? string : never;
};

/**
 * A mapping from keys of the given type to type assertion
 * functions for them. Note that each type must be a subtype of
 * string, e.g. `"yes"|"no"`.
 */
export type InputValidator<Input> = {
  [k in keyof Input]: Input[k] extends string
    ? (value: string) => value is Input[k]
    : never;
};

/**
 * A result of input validation with any associated
 * validation errors.
 */
export type ValidatedInput<Input> =
  | {
      result: Partial<Input>;
      errors: FormErrors<Input>;
    }
  | {
      result: Input;
      errors: undefined;
    };

/**
 * This function doesn't really do anything per se, it
 * just widens the passed-in type to represent unvalidated
 * input.
 */
export function asUnvalidatedInput<Input>(
  input: Input
): UnvalidatedInput<Input> {
  return input as any;
}

/**
 * Validate that the given unvalidated input is valid. If it's
 * not, validation error information is returned.
 */
export function validateInput<Input>(
  input: UnvalidatedInput<Input>,
  validator: InputValidator<Input>
): ValidatedInput<Input> {
  const result: Partial<Input> = {};
  const fieldErrors: FormFieldErrorMap<Input> = {};
  let hasErrors = false;

  for (let key in validator) {
    const isValid = validator[key];
    const value = input[key];
    if (typeof value === "string" && isValid(value)) {
      result[key] = value;
    } else {
      fieldErrors[key] = [new FormError("This value is invalid.")];
      hasErrors = true;
    }
  }

  return hasErrors
    ? {
        result,
        errors: {
          nonFieldErrors: [],
          fieldErrors,
        },
      }
    : {
        result: result as Input,
        errors: undefined,
      };
}
