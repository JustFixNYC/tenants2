import { RouteComponentProps } from "react-router";
import { BaseFormFieldProps } from "./form-fields";
import { FormContext } from "./form-context";
import { useState, useEffect, useContext } from "react";
import { getQuerystringVar } from "./querystring";
import { QueryLoaderQuery, QueryLoaderPrefetcher } from "./query-loader-prefetcher";
import { AppContext } from "./app-context";

function applyQsToFields(
  router: RouteComponentProps,
  fields: BaseFormFieldProps<string>[]
): boolean {
  let changed = false;
  for (let field of fields) {
    const qsValue = getQuerystringVar(router, field.name) || '';
    if (field.value !== qsValue) {
      field.onChange(qsValue);
      changed = true;
    }
  }
  return changed;
}

function areFieldsSameAsQs(
  router: RouteComponentProps,
  fields: BaseFormFieldProps<string>[]
): boolean {
  for (let field of fields) {
    const qsValue = getQuerystringVar(router, field.name) || '';
    if (field.value !== qsValue) {
      return false;
    }
  }
  return true;
}

export function SyncQuerystringToFields(props: {
  router: RouteComponentProps,
  fields: BaseFormFieldProps<string>[],
  ctx: FormContext<any>
}) {
  const { router, fields } = props;
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

function stringifyInputValue(varName: string, value: unknown): string {
  if (typeof(value) === 'string') {
    return value;
  } else {
    throw new Error(`Cannot convert input "${varName}" value of type "${typeof(value)}"`);
  }
}

type SupportedQsTypes<T> = {
  [k in keyof T]: T[k] extends string ? T[k] : never
};

function stableQuerystring(entries: Map<string, string>): string {
  return Array.from(entries.entries())
    .sort((a, b) => a[0] === b[0] ? 0 : (a[0] < b[0] ? -1 : 1))
    .map(entry => `${entry[0]}=${encodeURIComponent(entry[1])}`)
    .join('&');
}

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

function assertString(value: unknown): string {
  if (typeof(value) !== 'string') {
    throw new Error(`Expected value to be string, not ${typeof(value)}`);
  }
  return value;
}

export function getInitialQueryInputFromQs<T>(router: RouteComponentProps, defaultValue: SupportedQsTypes<T>): T {
  const result = {};
  for (let entry of Object.entries(defaultValue)) {
    const [varName, defaultVarValue] = entry;
    const qsValue = getQuerystringVar(router, varName);
    const value: string = qsValue === undefined ? assertString(defaultVarValue) : qsValue;
    (result as any)[varName] = value;
  }

  return result as any;
}

type QueryWithOutput<T> = {
  output: T
};

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
