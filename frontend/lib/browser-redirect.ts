import { History } from "history";
import { getGlobalAppServerInfo } from "./app-context";
import { getGlobalSiteRoutes } from "./routes";

type HardRedirector = (url: string) => void;

export type Redirector = (redirect: string, history: History) => void;

/** Tracks whether or not the next redirect should be hard. */
let shouldNextRedirectBeHard = false;

/**
 * Ensure that the next redirect is a hard one, forcing a full
 * page reload.
 *
 * This can be useful if e.g. we want to force an update to the
 * latest version of the codebase, or if we want to jettison
 * third-party scripts from the page.
 */
export function ensureNextRedirectIsHard() {
  shouldNextRedirectBeHard = true;
}

/* istanbul ignore next: mocking window.location is unreasonably hard in jest/jsdom. */
let hardRedirector: HardRedirector = (redirect: string) => {
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
  hardRedirector(url);
}

/**
 * Sets the underlying implementation for hard redirects.
 *
 * This function only exists because it's unreasonably hard to
 * mock out window.location in jest/jsdom.
 */
export function setHardRedirector(newValue: HardRedirector) {
  hardRedirector = newValue;
}

export const performSoftRedirect: Redirector = (redirect, history) => {
  if (shouldNextRedirectBeHard) {
    hardRedirector(redirect);
  } else {
    history.push(redirect);
  }
};

/**
 * Based on the type of URL we're given, perform either a "hard" redirect
 * whereby we leave our single-page application (SPA), or a "soft" redirect,
 * in which we stay in our SPA.
 */
export const performHardOrSoftRedirect: Redirector = (redirect, history) => {
  const localPath = unabsolutifyURLFromOurOrigin(redirect);
  if (localPath && getGlobalSiteRoutes().routeMap.exists(localPath)) {
    performSoftRedirect(localPath, history);
  } else {
    // This isn't a route we can serve from this single-page app,
    // but it might be something our underlying Django app can
    // serve, or it might be a trusted third-party site, so force
    // a browser refresh.
    hardRedirect(redirect);
  }
};

/**
 * Given a URL, return everything after its origin if it is
 * rooted at our origin. If it's already a relative URL,
 * return it as-is. Otherwise, return null.
 */
export function unabsolutifyURLFromOurOrigin(
  url: string,
  origin: string = getGlobalAppServerInfo().originURL
): string | null {
  if (url[0] === "/") return url;
  if (url.indexOf(`${origin}/`) === 0) {
    return url.slice(origin.length);
  }
  return null;
}

/**
 * Given a URL passed to us by an untrusted party, ensure that it has
 * the given origin, to mitigate the possibility of us being used as
 * an open redirect: http://cwe.mitre.org/data/definitions/601.html.
 */
export function absolutifyURLToOurOrigin(url: string, origin: string): string {
  if (url.indexOf(`${origin}/`) === 0) {
    return url;
  }
  if (url[0] !== "/") {
    url = `/${url}`;
  }
  return `${origin}${url}`;
}
