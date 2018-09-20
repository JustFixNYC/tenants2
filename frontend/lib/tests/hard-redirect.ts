type Redirector = (url: string) => void;

/* istanbul ignore next: mocking window.location is unreasonably hard in jest/jsdom. */
let redirector: Redirector = (redirect: string) => {
  window.location.href = redirect;
};

/**
 * Performs a hard redirect (as opposed to a soft redirect, whereby we
 * move the user to somewhere different in our single-page application).
 * 
 * This function only exists because it's unreasonably hard to
 * mock out window.location in jest/jsdom.
 * 
 * @param url The URL to redirect the user to.
 */
export default function hardRedirect(url: string) {
  redirector(url);
}

/**
 * Sets the underlying implementation for hard redirects.
 * 
 * This function only exists because it's unreasonably hard to
 * mock out window.location in jest/jsdom.
 */
export function setHardRedirector(newValue: Redirector) {
  redirector = newValue;
}
