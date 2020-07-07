import { deepStrictEqual } from "assert";

/**
 * Assert that the given argument isn't null and return it. Throw
 * an exception otherwise.
 *
 * This is primarily useful for situations where we're unable to
 * statically verify that something isn't null (e.g. due to the limitations
 * of typings we didn't write) but are sure it won't be in practice.
 */
export function assertNotNull<T>(thing: T | null): T | never {
  if (thing === null) {
    throw new Error("Assertion failure, expected argument to not be null!");
  }
  return thing;
}

/**
 * Assert that the given argument isn't undefined and return it. Throw
 * an exception otherwise.
 *
 * This is primarily useful for situations where we're unable to
 * statically verify that something isn't undefined (e.g. due to the limitations
 * of typings we didn't write) but are sure it won't be in practice.
 */
export function assertNotUndefined<T>(thing: T | undefined): T | never {
  if (thing === undefined) {
    throw new Error(
      "Assertion failure, expected argument to not be undefined!"
    );
  }
  return thing;
}

/**
 * This function throws an exception with the given optional message. It's
 * useful as an assertion in combination with the logical OR or nullish
 * coalescing operators, as a way of asserting that a value must always
 * be truthy or non-nullish.
 */
export function hardFail(
  msg: string = "Code should never reach this point!"
): never {
  throw new Error(msg);
}

/**
 * Call the given callback within the given time period, if it isn't
 * called earlier.
 *
 * Note that callers should call the return value of this function,
 * rather than the original callback, as only the return value contains
 * the bookeeping logic ensuring that the callback is only called once.
 */
export function callOnceWithinMs(
  cb: () => void,
  timeoutMs: number
): () => void {
  let timeout: number | null = null;
  const wrapped = () => {
    if (timeout !== null) {
      window.clearTimeout(timeout);
      timeout = null;
      cb();
    }
  };
  timeout = window.setTimeout(wrapped, timeoutMs);
  return wrapped;
}

/**
 * Given an unknown argument that might be an object with a named property
 * that is a function, returns said function, or undefined.
 */
export function getFunctionProperty(
  obj: unknown,
  name: string
): Function | undefined {
  // I thought that it'd be easier to narrow the 'unknown' type here, but
  // the only way I could accomplish it was by doing the following. But
  // I really wanted a chance to use the shiny new unknown type!
  //
  // So here here we are.
  if (obj instanceof Object) {
    const desc = Object.getOwnPropertyDescriptor(obj, name);
    if (desc && typeof desc.value === "function") {
      return desc.value;
    }
  }
  return undefined;
}

/**
 * Given an object whose interface is a superset of another, this
 * "trims" the superset to contain only the keys specified by
 * the subset.
 *
 * If the superset is null, the subset is returned.
 */
export function exactSubsetOrDefault<Subset, Superset extends Subset>(
  superset: Superset | null,
  defaultSubset: Subset
): Subset {
  if (!superset) {
    return defaultSubset;
  }
  const result = {} as Subset;

  for (let key in defaultSubset) {
    result[key] = superset[key];
  }

  return result;
}

/**
 * This just takes two arguments and wraps them in an Array.
 * More significantly, it associates TypeScript's Tuple type
 * with the array, which is useful because TypeScript doesn't
 * otherwise know how to infer a Tuple from an Array.
 *
 * This solution was inspired by the following gist:
 *
 * https://gist.github.com/whitecolor/0f4ae76a687a187e48e4eaf158905bed
 */
export function twoTuple<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

/**
 * Returns whether the given arguments have deep equality.
 *
 * For more details, see:
 *
 * https://nodejs.org/api/assert.html#assert_assert_deepstrictequal_actual_expected_message
 */
export function isDeepEqual<T>(a: T, b: T): boolean {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch (e) {
    return false;
  }
}

/** Capitalize each word of the given string. */
export function properNoun(text: string): string {
  return text
    .split(" ")
    .map(
      (word) =>
        `${word.slice(0, 1).toUpperCase()}${word.slice(1).toLowerCase()}`
    )
    .join(" ");
}

/**
 * Return the given number with comma separators for improved readability.
 *
 * The implementation was taken from https://stackoverflow.com/a/2901298.
 *
 * Note that `Intl.NumberFormat` can do the same thing, but it's not
 * available in older browsers, and polyfilling all of `Intl` would
 * potentially add a lot of weight to our JS bundle.
 */
export function numberWithCommas(x: number): string {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/**
 * Convert a U.S. phone number from 10-digit or E.164 format into a
 * more human-readable one.
 *
 * If the phone number doesn't appear to be valid, it is returned as-is.
 */
export function friendlyPhoneNumber(phoneNumber: string): string {
  const match = phoneNumber.match(/^(?:\+1)?(\d\d\d)(\d\d\d)(\d\d\d\d)$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
}
