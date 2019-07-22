import React, { useContext, useState, useEffect } from 'react';
import Routes from "../routes";
import { RouteComponentProps, Route } from "react-router";
import Page from "../page";
import { createSimpleQuerySubmitHandler } from '../forms-graphql-simple-query';
import { AppContext } from '../app-context';
import { DataDrivenOnboardingSuggestions, DataDrivenOnboardingSuggestionsVariables, DataDrivenOnboardingSuggestions_output, DataDrivenOnboardingSuggestions_output_suggestions } from '../queries/DataDrivenOnboardingSuggestions';
import { FormSubmitter } from '../form-submitter';
import { NextButton } from '../buttons';
import { AddressAndBoroughField } from '../pages/onboarding-step-1';
import { BaseFormFieldProps } from '../form-fields';
import { FormContext } from '../form-context';
import { getQuerystringVar } from '../querystring';
import { QueryLoaderPrefetcher } from '../query-loader-prefetcher';

function SyncFieldsWithQuerystring(props: {
  router: RouteComponentProps,
  fields: BaseFormFieldProps<string>[],
  ctx: FormContext<any>
}) {
  const { router } = props;
  const [triggeredChange, setTriggeredChange] = useState(false);

  // This effect detects when the current query in our URL has changed,
  // and matches our search field to sync with it.
  useEffect(() => {
    let changed = false;
    for (let field of props.fields) {
      const qsValue = getQuerystringVar(router, field.name) || '';
      if (field.value !== qsValue) {
        field.onChange(qsValue);
        changed = true;
      }
    }
    if (changed) {
      setTriggeredChange(true);
    }
  }, props.fields.map(f => getQuerystringVar(router, f.name)));

  // This effect detects when our search fields have caught up with our
  // URL change, and immediately triggers a form submission.
  useEffect(() => {
    if (triggeredChange) {
      for (let field of props.fields) {
        const qsValue = getQuerystringVar(router, field.name) || '';
        if (field.value !== qsValue) {
          return;
        }
      }
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

function maybePushHistory<T>(router: RouteComponentProps, input: SupportedQsTypes<T>) {
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

function getInitialStateFromQs<T>(router: RouteComponentProps, defaultValue: SupportedQsTypes<T>): T {
  const result = {};
  for (let entry of Object.entries(defaultValue)) {
    const [varName, defaultVarValue] = entry;
    if (typeof(defaultVarValue) === 'string') {
      const qsValue = getQuerystringVar(router, varName);
      const value: string = qsValue === undefined ? defaultVarValue : qsValue;
      (result as any)[varName] = value;
    } else {
      throw new Error(`Cannot convert input "${varName}" value of type "${typeof(defaultVarValue)}"`);
    }
  }

  return result as any;
}

function useLatestOutput(
  router: RouteComponentProps,
  initialState: DataDrivenOnboardingSuggestionsVariables
) {
  const appCtx = useContext(AppContext);
  const qlp = new QueryLoaderPrefetcher(router, appCtx, DataDrivenOnboardingSuggestions, initialState);
  let initialResults: DataDrivenOnboardingSuggestions_output|null = null;

  qlp.maybeQueueForPrefetching();

  if (qlp.prefetchedResponse) {
    const { output } = qlp.prefetchedResponse;
    initialResults = output;
  }

  return useState(initialResults);
}

function AutoSubmitter(props: {
  autoSubmit: boolean,
  ctx: FormContext<any>
}) {
  useEffect(() => {
    if (props.autoSubmit) {
      props.ctx.submit();
    }
  }, [props.autoSubmit]);

  return null;
}

function Suggestion(props: DataDrivenOnboardingSuggestions_output_suggestions) {
  const sugg = props;
  return <a href={sugg.url} target="_blank" rel="noopener noreferrer">{sugg.name}</a>;
}

function Results(props: {
  address: string,
  output: DataDrivenOnboardingSuggestions_output|null,
}) {
  let content = null;
  if (props.output) {
    content = <>
      <p>Here is some cool info about <strong>{props.output.fullAddress}.</strong></p>
      <ol>
        {props.output.suggestions.map((suggestion, i) =>
          <li key={i}><Suggestion {...suggestion} /></li>)}
      </ol>
    </>;
  } else if (props.address.trim()) {
    content = <>
      <p>Sorry, we don't recognize the address you entered.</p>
    </>;
  }
  return <div className="content">
    <br/>
    {content}
  </div>;
}

function DataDrivenOnboardingPage(props: RouteComponentProps) {
  const appCtx = useContext(AppContext);
  const defaultState = {address: '', borough: ''};
  const initialState = getInitialStateFromQs(props, defaultState);
  const [latestOutput, setLatestOutput] = useLatestOutput(props, initialState);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const onSubmit = createSimpleQuerySubmitHandler(appCtx.fetch, DataDrivenOnboardingSuggestions.fetch, input => {
    setAutoSubmit(false);
    maybePushHistory(props, input);
  });

  return <Page title="Data-driven onboarding prototype">
    <FormSubmitter
      initialState={initialState}
      onSubmit={onSubmit}
      onSuccess={output => {
        setLatestOutput(output.simpleQueryOutput);
      }}
    >
      {ctx => <>
        <AddressAndBoroughField
          key={props.location.search}
          addressLabel="Enter an address and we'll give you some cool info."
          hideBoroughField={appCtx.session.isSafeModeEnabled ? false : true}
          addressProps={ctx.fieldPropsFor('address')}
          boroughProps={ctx.fieldPropsFor('borough')}
          onChange={() => setAutoSubmit(true)}
        />
        <AutoSubmitter ctx={ctx} autoSubmit={autoSubmit} />
        <SyncFieldsWithQuerystring router={props} fields={[
          ctx.fieldPropsFor('address'),
          ctx.fieldPropsFor('borough'),
        ]} ctx={ctx} />
        <NextButton label="Gimme some info" isLoading={ctx.isLoading} />
        {!ctx.isLoading && <Results address={ctx.fieldPropsFor('address').value} output={latestOutput} />}
      </>}
    </FormSubmitter>
  </Page>;
}

export default function DataDrivenOnboardingRoutes(): JSX.Element {
  return <Route path={Routes.locale.dataDrivenOnboarding} exact component={DataDrivenOnboardingPage} />;
}
