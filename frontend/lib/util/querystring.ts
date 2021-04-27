/**
 * This is intentionally structured as a subset of react-router's
 * router context, to make it easy to interoperate with.
 */
export type LocationSearchInfo = {
  location: {
    search: string;
  };
};

/**
 * If given a string, return it directly, otherwise return the
 * given react-router context's search string.
 */
function getSearch(value: LocationSearchInfo | string): string {
  return typeof value === "string" ? value : value.location.search;
}

/**
 * Return the value of the last-defined key in the given querystring.
 */
export function getQuerystringVar(
  routeInfo: LocationSearchInfo | string,
  name: string
): string | undefined {
  const val = new URLSearchParams(getSearch(routeInfo).slice(1)).getAll(name);

  if (val.length > 0) {
    return val[val.length - 1];
  }

  return undefined;
}

/**
 * This is intentionally structured as a subset of our app context,
 * to make it easy to interoperate with.
 */
type HttpPostInfo = {
  legacyFormSubmission?: {
    POST: Partial<{ [key: string]: string }>;
  };
};

/**
 * If this is a POST, returns the last value of the given key, or undefined if
 * not present.
 *
 * Otherwise, returns the last-defined key in the given querystring.
 */
export function getPostOrQuerystringVar(
  info: LocationSearchInfo & HttpPostInfo,
  name: string
): string | undefined {
  if (info.legacyFormSubmission) {
    return info.legacyFormSubmission.POST[name];
  }
  return getQuerystringVar(info, name);
}
