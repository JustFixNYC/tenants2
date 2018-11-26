import querystring from 'querystring';

/**
 * This is intentionally structured as a subset of react-router's
 * router context, to make it easy to interoperate with.
 */
export type LocationSearchInfo = {
  location: {
    search: string
  }
};

/**
 * Return the value of the last-defined key in the given querystring.
 */
export function getQuerystringVar(routeInfo: LocationSearchInfo, name: string): string|undefined {
  let val = querystring.parse(routeInfo.location.search.slice(1))[name];

  if (Array.isArray(val)) {
    val = val[val.length - 1];
  }

  return val;
}

/**
 * This is intentionally structured as a subset of our app context,
 * to make it easy to interoperate with.
 */
type HttpPostInfo = {
  legacyFormSubmission?: {
    POST: Partial<{ [key: string]: string }>;
  }
};

/**
 * If this is a POST, returns the last value of the given key, or undefined if
 * not present.
 *
 * Otherwise, returns the last-defined key in the given querystring.
 */
export function getPostOrQuerystringVar(info: LocationSearchInfo & HttpPostInfo, name: string): string|undefined {
  if (info.legacyFormSubmission) {
    return info.legacyFormSubmission.POST[name];
  }
  return getQuerystringVar(info, name);
}
