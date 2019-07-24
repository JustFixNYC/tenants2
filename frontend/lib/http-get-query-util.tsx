import { RouteComponentProps } from "react-router";
import { BaseFormFieldProps } from "./form-fields";
import { FormContext } from "./form-context";
import { useState, useEffect, useContext } from "react";
import { getQuerystringVar, LocationSearchInfo } from "./querystring";
import { QueryLoaderQuery, QueryLoaderPrefetcher } from "./query-loader-prefetcher";
import { AppContext } from "./app-context";

/**
 * Make the given form fields reflect the current URL's querystring variables,
 * and return whether any field values were changed.
 */
function applyQsToFields(
  routeInfo: LocationSearchInfo|string,
  fields: BaseFormFieldProps<string>[]
): boolean {
  let changed = false;
  for (let field of fields) {
    const qsValue = getQuerystringVar(routeInfo, field.name) || '';
    if (field.value !== qsValue) {
      field.onChange(qsValue);
      changed = true;
    }
  }
  return changed;
}

/**
 * Return whether the given form fields are in-sync with the current
 * URL's querystring variables.
 */
function areFieldsSameAsQs(
  routeInfo: LocationSearchInfo|string,
  fields: BaseFormFieldProps<string>[]
): boolean {
  for (let field of fields) {
    const qsValue = getQuerystringVar(routeInfo, field.name) || '';
    if (field.value !== qsValue) {
      return false;
    }
  }
  return true;
}

/**
 * A React component which ensures that, whenever the user
 * navigates through their browser history, the given form fields
 * always match the current URL's querystring variables.
 * 
 * Furthermore, whenever the form fields change due to navigation,
 * their form is re-submitted.
 */
export function SyncQuerystringToFields(props: {
  routeInfo: LocationSearchInfo|string,
  fields: BaseFormFieldProps<string>[],
  ctx: FormContext<any>
}) {
  const { routeInfo: router, fields } = props;
  const [triggeredChange, setTriggeredChange] = useState(false);

  // This effect detects when the current query in our URL has changed,
  // and matches our search field to sync with it.
  useEffect(() => {
    if (applyQsToFields(router, fields)) {
      setTriggeredChange(true);
    }
  }, props.fields.map(f => getQuerystringVar(router, f.name)));

  // This effect detects when our search fields have caught up with our
  // URL change, and immediately triggers a form submission.
  useEffect(() => {
    if (triggeredChange && areFieldsSameAsQs(router, fields)) {
      props.ctx.submit(true);
      setTriggeredChange(false);
    }
  }, props.fields.map(f => f.value));

  return null;
}

/**
 * Convert the given input value to a string capable of being reprsented
 * in a querystring.
 */
function stringifyInputValue(varName: string, value: unknown): string {
  if (typeof(value) === 'string') {
    return value;
  } else {
    throw new Error(`Cannot convert input "${varName}" value of type "${typeof(value)}"`);
  }
}

/**
 * These are the data types we currently support being represented
 * in the querystring.
 * 
 * Ensuring any unsupported types map to "never" essentially means we
 * have type errors whenever we try representing unsupported data
 * types in the querystring.
 */
type SupportedQsTypes<T> = {
  [k in keyof T]: T[k] extends string ? T[k] : never
};

/**
 * Convert the given mapping to a querystring, sorting the
 * keys such that we always have the same querystring regardless
 * of the original order of the mapping's entries.
 */
function stableQuerystring(entries: Map<string, string>): string {
  return Array.from(entries.entries())
    .sort((a, b) => a[0] === b[0] ? 0 : (a[0] < b[0] ? -1 : 1))
    .map(entry => `${entry[0]}=${encodeURIComponent(entry[1])}`)
    .join('&');
}

/**
 * If the given input doesn't reflect the current querystring,
 * push a new entry into the browser history which does reflect
 * it.
 */
export function maybePushQueryInputToHistory<T>(router: RouteComponentProps, input: SupportedQsTypes<T>) {
  let changed = false;
  const newQsEntries = new Map<string, string>();
  for (let entry of Object.entries(input)) {
    const varName = entry[0];
    const value = stringifyInputValue(varName, entry[1]);
    const qsValue = getQuerystringVar(router, varName) || '';
    newQsEntries.set(varName, value);
    if (qsValue !== value) {
      changed = true;
    }
  }

  if (changed) {
    const qs = stableQuerystring(newQsEntries);
    router.history.push(router.location.pathname + `?${qs}`);
  }
}

/** Ensure that the given value is a string and return it. */
function assertString(value: unknown): string {
  if (typeof(value) !== 'string') {
    throw new Error(`Expected value to be string, not ${typeof(value)}`);
  }
  return value;
}

/**
 * Attempt to convert the current URL's querystring into an input
 * value object, replacing any missing fields with a default value.
 */
export function getInitialQueryInputFromQs<T>(
  routeInfo: LocationSearchInfo|string,
  defaultValue: SupportedQsTypes<T>
): T {
  const result = {};
  for (let entry of Object.entries(defaultValue)) {
    const [varName, defaultVarValue] = entry;
    const qsValue = getQuerystringVar(routeInfo, varName);
    const value: string = qsValue === undefined ? assertString(defaultVarValue) : qsValue;
    (result as any)[varName] = value;
  }

  return result as any;
}

/** A GraphQL query whose main output is mapped to the key 'output'. */
type QueryWithOutput<T> = {
  output: T
};

/**
 * A React Hook that returns a value/setter tuple (similar to `useState()`) for
 * retrieving and setting the latest result of a GraphQL query, assuming the query's
 * main output is mapped to the 'output' key.
 * 
 * If possible, the initial query result will be pre-fetched from the server during
 * server-side rendering, to ensure that user's don't see a "loading" throbber
 * when they first visit the page, and to ensure that the page is usable on
 * clients that don't have functional JavaScript.
 */
export function useLatestQueryOutput<Input, Output>(
  router: RouteComponentProps,
  query: QueryLoaderQuery<Input, QueryWithOutput<Output>>,
  initialState: Input
) {
  const appCtx = useContext(AppContext);
  const qlp = new QueryLoaderPrefetcher(router, appCtx, query, initialState);
  let initialResults: Output|null = null;

  qlp.maybeQueueForPrefetching();

  if (qlp.prefetchedResponse) {
    initialResults = qlp.prefetchedResponse.output;
  }

  return useState(initialResults);
}
