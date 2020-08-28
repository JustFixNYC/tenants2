import { RouteComponentProps } from "react-router";
import { FormContext } from "../forms/form-context";
import { useState, useEffect, useContext } from "react";
import { getQuerystringVar } from "../util/querystring";
import {
  QueryLoaderQuery,
  QueryLoaderPrefetcher,
} from "./query-loader-prefetcher";
import { AppContext } from "../app-context";

/**
 * These are the data types we currently support being represented
 * in the querystring.
 *
 * Ensuring any unsupported types map to "never" essentially means we
 * have type errors whenever we try representing unsupported data
 * types in the querystring.
 */
export type SupportedQsTypes<T> = {
  [k in keyof T]: T[k] extends string ? T[k] : never;
};

export class QuerystringConverter<T> {
  /**
   * A class for manipulating a URL's querystring, converting it
   * to/from a data structure, and doing other common operations
   * with it.
   *
   * @param search The URL search string (a.k.a. querystring),
   *   e.g. `?foo=1&bar=blop`.
   *
   * @param defaultInput The relevant querystring keys that have
   *   meaning to our application, along with their default values
   *   if they're missing from the querystring.
   */
  constructor(
    readonly search: string,
    readonly defaultInput: SupportedQsTypes<T>
  ) {}

  /**
   * Return whether the given form fields are in-sync with the current
   * URL's querystring variables.
   */
  areFormFieldsSynced(ctx: FormContext<SupportedQsTypes<T>>): boolean {
    for (let key in this.defaultInput) {
      const qsValue = getQuerystringVar(this.search, key) || "";
      const fieldProps = ctx.fieldPropsFor(key);
      if (fieldProps.value !== qsValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Make the given form fields reflect the current URL's querystring variables,
   * and return whether any field values were changed.
   */
  applyToFormFields(ctx: FormContext<SupportedQsTypes<T>>): boolean {
    const values = this.toFormInput();
    let changed = false;
    for (let key in this.defaultInput) {
      const fieldProps = ctx.fieldPropsFor(key);
      const qsValue = values[key];
      if (fieldProps.value !== qsValue) {
        fieldProps.onChange(qsValue);
        changed = true;
      }
    }
    return changed;
  }

  /**
   * Filter the current querystring to only contain
   * relevant keys with valid values, in alphabetical
   * order. Return the resulting querystring.
   */
  toStableQuerystring(): string {
    const values = this.toFormInput();
    const entries = new Map<string, string>();

    for (let key in values) {
      entries.set(key, values[key]);
    }

    return stableQuerystring(entries);
  }

  /**
   * If the given input doesn't reflect the current querystring,
   * push a new entry into the browser history which does reflect
   * it.
   */
  maybePushToHistory(
    input: SupportedQsTypes<T>,
    router: Pick<RouteComponentProps, "location" | "history">
  ) {
    const currentQs = this.toStableQuerystring();
    const newQs = inputToQuerystring(input);

    if (currentQs !== newQs) {
      router.history.push(router.location.pathname + newQs);
    }
  }

  /** Convert the current querystring to form input. */
  toFormInput(): SupportedQsTypes<T> {
    let result = Object.assign({}, this.defaultInput);

    for (let key in this.defaultInput) {
      const value = getQuerystringVar(this.search, key);
      if (value !== undefined) {
        (result as any)[key] = value;
      }
    }

    return result;
  }
}

/**
 * A React component which ensures that, whenever the user
 * navigates through their browser history, the given form fields
 * always match the current URL's querystring variables.
 *
 * Furthermore, whenever the form fields change due to navigation,
 * their form is re-submitted.
 */
export function SyncQuerystringToFields<T>(props: {
  qs: QuerystringConverter<T>;
  ctx: FormContext<SupportedQsTypes<T>>;
}) {
  const { qs, ctx } = props;
  const [triggeredChange, setTriggeredChange] = useState(false);

  // This effect detects when the current query in our URL has changed,
  // and matches our search field to sync with it.
  useEffect(() => {
    if (qs.applyToFormFields(ctx)) {
      setTriggeredChange(true);
    }
    // The following deps are legacy code that has been working for months;
    // we don't want to break it by satisfying eslint now.
    // eslint-disable-next-line
  }, [qs.toStableQuerystring()]);

  // This effect detects when our search fields have caught up with our
  // URL change, and immediately triggers a form submission.
  //
  // The following is also legacy code that has been working for months;
  // we don't want to break it by satisfying eslint now.
  // eslint-disable-next-line
  useEffect(() => {
    if (triggeredChange && qs.areFormFieldsSynced(ctx)) {
      ctx.submit(true);
      setTriggeredChange(false);
    }
  });

  return null;
}

/**
 * Convert the given mapping to a querystring, sorting the
 * keys such that we always have the same querystring regardless
 * of the original order of the mapping's entries.
 */
function stableQuerystring(entries: Map<string, string>): string {
  return (
    "?" +
    Array.from(entries.entries())
      .sort((a, b) => (a[0] === b[0] ? 0 : a[0] < b[0] ? -1 : 1))
      .map((entry) => `${entry[0]}=${encodeURIComponent(entry[1])}`)
      .join("&")
  );
}

/** Convert the given input object to a querystring. */
export function inputToQuerystring<T>(input: SupportedQsTypes<T>): string {
  return new QuerystringConverter("", input).toStableQuerystring();
}

/** A GraphQL query whose main output is mapped to the key 'output'. */
export type QueryWithOutput<T> = {
  output: T;
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
  let initialResults: Output | undefined = undefined;

  qlp.maybeQueueForPrefetching();

  if (qlp.prefetchedResponse) {
    initialResults = qlp.prefetchedResponse.output;
  }

  return useState(initialResults);
}
