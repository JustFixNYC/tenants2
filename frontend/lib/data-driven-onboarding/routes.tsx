import React, { useContext, useState, useEffect } from 'react';
import Routes from "../routes";
import { RouteComponentProps, Route } from "react-router";
import Page from "../page";
import { createSimpleQuerySubmitHandler } from '../forms-graphql-simple-query';
import { AppContext } from '../app-context';
import { DataDrivenOnboardingSuggestions, DataDrivenOnboardingSuggestions_output, DataDrivenOnboardingSuggestions_output_suggestions } from '../queries/DataDrivenOnboardingSuggestions';
import { FormSubmitter } from '../form-submitter';
import { NextButton } from '../buttons';
import { AddressAndBoroughField } from '../pages/onboarding-step-1';
import { FormContext } from '../form-context';
import { getInitialQueryInputFromQs, useLatestQueryOutput, maybePushQueryInputToHistory, SyncQuerystringToFields } from '../tests/http-get-query-util';

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
  const initialState = getInitialQueryInputFromQs(props, defaultState);
  const [latestOutput, setLatestOutput] = useLatestQueryOutput(props, DataDrivenOnboardingSuggestions, initialState);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const onSubmit = createSimpleQuerySubmitHandler(appCtx.fetch, DataDrivenOnboardingSuggestions.fetch, input => {
    setAutoSubmit(false);
    maybePushQueryInputToHistory(props, input);
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
          addressProps={ctx.fieldPropsFor('address')}
          boroughProps={ctx.fieldPropsFor('borough')}
          onChange={() => setAutoSubmit(true)}
        />
        <AutoSubmitter ctx={ctx} autoSubmit={autoSubmit} />
        <SyncQuerystringToFields router={props} fields={[
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
