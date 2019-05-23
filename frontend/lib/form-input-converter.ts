import { YES_NO_RADIOS_TRUE, YES_NO_RADIOS_FALSE } from "./yes-no-radios-form-field";

type BooleanPropertyNames<T> = {
  [k in keyof T]: T[k] extends boolean ? k : never
}[keyof T];

type StringifiedBooleans<T, K extends BooleanPropertyNames<T>> = {
  [k in keyof T]: k extends K ? string : T[k]
};

type StringifiedNumbers<A> = {
  [K in keyof A]: A[K] extends number ? string : A[K]
};

/**
 * Convert *only* the given property names of the given object from
 * boolean values to stringified boolean values that our backend
 * will accept as valid choices for yes/no radio inputs.
 */
function withStringifiedBools<T, K extends BooleanPropertyNames<T>>(
  obj: T,
  ...keys: readonly K[]
): StringifiedBooleans<T, K> {
  const result = Object.assign({}, obj) as StringifiedBooleans<T, K>;
  for (let key of keys) {
    const type = typeof(obj[key]);
    if (type !== 'boolean') {
      throw new Error(`Expected key '${key}' to be a boolean, but it is ${type}`);
    }
    if (obj[key]) {
      result[key] = YES_NO_RADIOS_TRUE as any;
    } else {
      result[key] = YES_NO_RADIOS_FALSE as any;
    }
  }
  return result;
}

/**
 * Convert all numeric types in the given object to their string
 * representation.
 */
function withStringifiedNumbers<A>(obj: A): StringifiedNumbers<A> {
  let result: any = {};

  for (let key in obj) {
    const value = obj[key];
    result[key] = typeof(value) === 'number' ? value.toString() : value;
  }

  return result;
}

/**
 * This class converts strongly-typed data from the server into
 * a more loosely-typed, "stringifed" structure that's suitable for
 * submitting into GraphQL mutation endpoints that need to support
 * legacy HTTP POST.
 */
export class FormInputConverter<T> {
  /**
   * Create a converter instance.
   * 
   * @param data Strongly-typed data from the server.
   */
  constructor(readonly data: T) {
  }

  /**
   * Finish the conversion of the original data.
   */
  finish(): StringifiedNumbers<T> {
    return withStringifiedNumbers(this.data);
  }

  /**
   * Prepare boolean properties for use as input to yes/no radio button
   * form fields.
   *
   * @param keys Boolean properties from the original data needing conversion.
   */
  yesNoRadios<K extends BooleanPropertyNames<T>>(
    ...keys: readonly K[]
  ): FormInputConverter<StringifiedBooleans<T, K>> {
    return new FormInputConverter(withStringifiedBools(this.data, ...keys));
  }
}
