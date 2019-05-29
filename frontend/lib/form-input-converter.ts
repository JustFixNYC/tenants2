import { YES_NO_RADIOS_TRUE, YES_NO_RADIOS_FALSE } from "./yes-no-radios-form-field";

type NullBooleanPropertyNames<T> = {
  [k in keyof T]: T[k] extends boolean|null ? k : never
}[keyof T];

type StringifiedNullBooleans<T, K extends NullBooleanPropertyNames<T>> = {
  [k in keyof T]: k extends K ? string : T[k]
};

type StringifiedNumbers<A> = {
  [K in keyof A]: Extract<A[K], number> extends never ? A[K] : Exclude<A[K], number>|string
};

type StringifiedNulls<A> = {
  [K in keyof A]: Extract<A[K], null> extends never ? A[K] : Exclude<A[K], null>|string
};

/**
 * Convert *only* the given property names of the given object from
 * boolean or null values to stringified values that our backend
 * will accept as choices for yes/no radio inputs (or the lack of a choice,
 * if the original value was null).
 */
function withStringifiedNullBools<T, K extends NullBooleanPropertyNames<T>>(
  obj: T,
  ...keys: readonly K[]
): StringifiedNullBooleans<T, K> {
  const result = Object.assign({}, obj) as StringifiedNullBooleans<T, K>;
  for (let key of keys) {
    const value = obj[key];
    if (!(typeof(value) === 'boolean' || value === null)) {
      throw new Error(`Expected key '${key}' to be a boolean or null, but it is ${typeof(value)}`);
    }
    if (value === true) {
      result[key] = YES_NO_RADIOS_TRUE as any;
    } else if (value === false) {
      result[key] = YES_NO_RADIOS_FALSE as any;
    } else {
      result[key] = '' as any;
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
 * Convert all nulls in the given object to the empty string.
 */
function withStringifiedNulls<A>(obj: A): StringifiedNulls<A> {
  let result: any = {};

  for (let key in obj) {
    const value = obj[key];
    result[key] = value === null ? '' : value;
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
  finish(): StringifiedNulls<StringifiedNumbers<T>> {
    return withStringifiedNulls(withStringifiedNumbers(this.data));
  }

  /**
   * Prepare boolean properties for use as input to yes/no radio button
   * form fields.
   *
   * @param keys Boolean properties from the original data needing conversion.
   */
  yesNoRadios<K extends NullBooleanPropertyNames<T>>(
    ...keys: readonly K[]
  ): FormInputConverter<StringifiedNullBooleans<T, K>> {
    return new FormInputConverter(withStringifiedNullBools(this.data, ...keys));
  }
}
