/**
 * Find an element.
 * 
 * @param tagName The name of the element's HTML tag.
 * @param selector The selector for the element, not including its HTML tag.
 * @param parent The parent node to search within.
 */
export function getElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  selector: string,
  parent: ParentNode = document
): HTMLElementTagNameMap[K] {
  const finalSelector = `${tagName}${selector}`;
  const node = parent.querySelector(finalSelector);
  if (!node) {
    throw new Error(`Couldn't find any elements matching "${finalSelector}"`);
  }
  return node as HTMLElementTagNameMap[K];
}

/**
 * Assert that the given argument isn't null and return it. Throw
 * an exception otherwise.
 * 
 * This is primarily useful for situations where we're unable to
 * statically verify that something isn't null (e.g. due to the limitations
 * of typings we didn't write) but are sure it won't be in practice.
 */
export function assertNotNull<T>(thing: T|null): T|never {
  if (thing === null) {
    throw new Error('Assertion failure, expected argument to not be null!');
  }
  return thing;
}

/**
 * This class can be used to omit a set of keys from a type.
 * 
 * This type was taken from:
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Convert a Date to just the date part of its ISO representation,
 * e.g. '2018-09-15'.
 */
export function dateAsISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Convert a Date to just the date part of its ISO representation,
 * e.g. '2018-09-15'.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
}

/** Our preferred time zone, which we assume most/all users are in. */
const PREFERRED_TIME_ZONE = 'America/New_York';

/**
 * Return the given date formatted in a friendly way, like
 * "Saturday, September 15, 2018". If the browser doesn't have the
 * Intl object, however, we'll return a less-friendly string like
 * "Sat Sep 15 2018".
 */
export function friendlyDate(date: Date, timeZone: string = PREFERRED_TIME_ZONE) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  try {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone}).format(date);
  } catch (e) {
    try {
      return new Intl.DateTimeFormat("en-US", options).format(date);
    } catch (e) {
      return date.toDateString();
    }
  }
}

/**
 * Call the given callback within the given time period, if it isn't
 * called earlier.
 * 
 * Note that callers should call the return value of this function,
 * rather than the original callback, as only the return value contains
 * the bookeeping logic ensuring that the callback is only called once.
 */
export function callOnceWithinMs(cb: () => void, timeoutMs: number): () => void {
  let timeout: number|null = null;
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
export function getFunctionProperty(obj: unknown, name: string): Function|undefined {
  // I thought that it'd be easier to narrow the 'unknown' type here, but
  // the only way I could accomplish it was by doing the following. But
  // I really wanted a chance to use the shiny new unknown type!
  //
  // So here here we are.
  if (obj instanceof Object) {
    const desc = Object.getOwnPropertyDescriptor(obj, name);
    if (desc && typeof(desc.value) === 'function') {
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
export function exactSubsetOrDefault<Subset, Superset extends Subset>(superset: Superset|null, defaultSubset: Subset): Subset {
  if (!superset) {
    return defaultSubset;
  }
  const result = {} as Subset;

  for (let key in defaultSubset) {
    result[key] = superset[key];
  }

  return result;
}
