import { isDeepEqual } from "../util/util";

/**
 * Returns whether or not the two arrays have the same items,
 * even if they're not in the same order.
 */
export function areArraysEqualIgnoringOrder(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;

  const bSet = new Set(b);

  for (let aItem of a) {
    if (!bSet.has(aItem)) return false;
  }

  return true;
}

/**
 * If the two arrays contain objects, returns whether they have
 * deep equality; otherwise, returns whether or not the two
 * arrays have the same items, even if they're not in the same
 * order.
 */
function areFormInputArraysEqual(a: any[], b: any[]): boolean {
  if (a[0] && typeof a[0] === "object") {
    return isDeepEqual(a, b);
  }
  return areArraysEqualIgnoringOrder(a, b);
}

/**
 * Returns whether or not the two sets of form fields have the
 * same values.
 *
 * Note that we currently treat arrays of non-object items as being
 * order-indepenedent, e.g. a field with the value ["A", "B"] is,
 * for our purposes, the same as a field with the value ["B", "A"].
 */
export function areFieldsEqual<FormInput>(
  initial: FormInput,
  current: FormInput
): boolean {
  for (let key in initial) {
    const initialValue = initial[key];
    const currentValue = current[key];
    if (initialValue !== currentValue) {
      if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
        if (!areFormInputArraysEqual(initialValue, currentValue)) {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  return true;
}
