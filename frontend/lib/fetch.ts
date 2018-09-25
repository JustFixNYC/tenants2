let dynamicImport: Promise<typeof fetch>|null = null;

/**
 * Dynamically import fetch and return it.
 * 
 * I'm not actually sure if dynamic import() will fetch the same module
 * multiple times if it's called multiple times before it's resolved,
 * so just in case, I'm implementing that logic myself. This function
 * ensures that only one request for the code bundle we need is
 * ever made.
 */
function dynamicallyImportFetch(): Promise<typeof fetch> {
  if (!dynamicImport) {
    dynamicImport = import(/* webpackChunkName: "fetch" */ 'isomorphic-fetch')
      .then(res => res.default);
  }
  return dynamicImport;
}

/**
 * Just like window.fetch(), but dynamically loads a polyfill
 * if needed.
 */
export const awesomeFetch: typeof fetch = function(this: any) {
  if (typeof(fetch) === 'function') {
    return fetch.apply(this, arguments);
  }
  return dynamicallyImportFetch().then(fetch => {
    return fetch.apply(this, arguments);
  });
};

/**
 * Creates an AbortController if the browser supports it,
 * but returns undefined if not.
 */
export function createAbortController(): AbortController|undefined {
  if (typeof(AbortController) === 'undefined') {
    return undefined;
  }
  return new AbortController();
}
