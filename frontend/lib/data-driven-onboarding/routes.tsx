import React, { useContext, useState, useEffect } from 'react';
import Routes from "../routes";
import { RouteComponentProps, Route } from "react-router";
import Page from "../page";
import { createSimpleQuerySubmitHandler } from '../forms-graphql-simple-query';
import { AppContext } from '../app-context';
import { DataDrivenOnboardingSuggestions } from '../queries/DataDrivenOnboardingSuggestions';
import { FormSubmitter } from '../form-submitter';
import { NextButton } from '../buttons';
import { AddressAndBoroughField } from '../pages/onboarding-step-1';
import { BaseFormFieldProps } from '../form-fields';
import { FormContext } from '../form-context';
import { getQuerystringVar } from '../querystring';

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

function maybePushHistory(router: RouteComponentProps, input: Object) {
  let changed = false;
  const newQsEntries = new Map<string, string>();
  for (let entry of Object.entries(input)) {
    const [varName, value] = entry;
    const qsValue = getQuerystringVar(router, varName) || '';
    if (typeof(value) === 'string') {
      newQsEntries.set(varName, value);
      if (qsValue !== value) {
        changed = true;
      }
    } else {
      throw new Error(`Cannot convert input "${varName}" value of type "${typeof(value)}"`);
    }
  }

  if (changed) {
    const qs = Array.from(newQsEntries.entries())
      .sort((a, b) => a[0] === b[0] ? 0 : (a[0] < b[0] ? -1 : 1))
      .map(entry => `${entry[0]}=${encodeURIComponent(entry[1])}`)
      .join('&');
    router.history.push(router.location.pathname + `?${qs}`);
  }
}

function AutoSubmitOnChange(props: {
  enabled: boolean,
  ctx: FormContext<any>
}) {
  useEffect(() => {
    if (props.enabled) {
      console.log("Auto-submitting now.");
      props.ctx.submit();
    }
  }, [props.enabled]);

  return null;
}

function DataDrivenOnboardingPage(props: RouteComponentProps) {
  const appCtx = useContext(AppContext);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const onSubmit = createSimpleQuerySubmitHandler(appCtx.fetch, DataDrivenOnboardingSuggestions.fetch, input => {
    setAutoSubmit(false);
    maybePushHistory(props, input);
  });
  const initialState = {address: '', borough: ''};

  return <Page title="Data-driven onboarding prototype">
    <FormSubmitter
      initialState={initialState}
      onSubmit={onSubmit}
      onSuccess={output => {}}
    >
      {ctx => <>
        <AddressAndBoroughField
          key={props.location.search}
          addressProps={ctx.fieldPropsFor('address')}
          boroughProps={ctx.fieldPropsFor('borough')}
          onChange={() => setAutoSubmit(true)}
        />
        <AutoSubmitOnChange ctx={ctx} enabled={autoSubmit} />
        <SyncFieldsWithQuerystring router={props} fields={[
          ctx.fieldPropsFor('address'),
          ctx.fieldPropsFor('borough'),
        ]} ctx={ctx} />
        <NextButton label="Gimme some info" isLoading={ctx.isLoading} />
      </>}
    </FormSubmitter>
  </Page>;
}

export default function DataDrivenOnboardingRoutes(): JSX.Element {
  return <Route path={Routes.locale.dataDrivenOnboarding} exact component={DataDrivenOnboardingPage} />;
}
