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
 * 
 * This conversion is required to support legacy HTTP POST.
 */
export function withStringifiedBools<T, K extends BooleanPropertyNames<T>>(
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
      result[key] = 'True' as any;
    } else {
      result[key] = 'False' as any;
    }
  }
  return result;
}

/**
 * Convert all numeric types in the given object to their string
 * representation.
 * 
 * This conversion is required to support legacy HTTP POST.
 */
export function withStringifiedNumbers<A>(obj: A): StringifiedNumbers<A> {
  let result: any = {};

  for (let key in obj) {
    const value = obj[key];
    result[key] = typeof(value) === 'number' ? value.toString() : value;
  }

  return result;
}
