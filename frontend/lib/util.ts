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
 * Auto-binds the given method names to the given object so that all
 * their invocations have the object as their "this" context.
 * 
 * @param obj The object with methods on it.
 * @param args The names of methods to autobind.
 */
export function autobind<T, K extends keyof T>(obj: T, ...args: K[]) {
  // Ideally we'd use conditional types to ensure that the property names
  // passed in are the names of methods, but I had trouble figuring out
  // how to do this, so we'll just verify that they're methods at runtime.
  args.forEach(name => {
    const fn = obj[name];

    if (fn instanceof Function) {
      obj[name] = fn.bind(obj);
    } else {
      throw new Error(`Assertion failure, property "${name}" is not a function!`);
    }
  });
}
