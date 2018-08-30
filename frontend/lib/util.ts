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
