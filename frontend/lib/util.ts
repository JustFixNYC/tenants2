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
