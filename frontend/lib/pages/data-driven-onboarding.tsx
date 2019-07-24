import React, { useContext, useState, useEffect } from 'react';
import Routes from "../routes";
import { RouteComponentProps, Route } from "react-router";
import Page from "../page";
import { createSimpleQuerySubmitHandler } from '../forms-graphql-simple-query';
import { AppContext } from '../app-context';
import { DataDrivenOnboardingSuggestions, DataDrivenOnboardingSuggestions_output } from '../queries/DataDrivenOnboardingSuggestions';
import { FormSubmitter } from '../form-submitter';
import { NextButton } from '../buttons';
import { FormContext } from '../form-context';
import { getInitialQueryInputFromQs, useLatestQueryOutput, maybePushQueryInputToHistory, SyncQuerystringToFields } from '../http-get-query-util';
import { WhoOwnsWhatLink } from '../tests/wow-link';
import { AddressAndBoroughField } from '../address-and-borough-form-field';

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

function Results(props: {
  address: string,
  output: DataDrivenOnboardingSuggestions_output|null,
}) {
  let content = null;
  if (props.output) {
    const { output } = props;
    content = <>
      <p>Here is some cool info about <strong>{output.fullAddress}.</strong></p>
      <ol>
        <li>It is in ZIP code {output.zipcode}.</li>
        <li>It has {output.unitCount} units.</li>
        {!!output.stabilizedUnitCount2007 && <li>{output.stabilizedUnitCount2007} units were rent-stabilized in 2007.</li>}
        {!!output.stabilizedUnitCount2017 && <li>{output.stabilizedUnitCount2017} units were rent-stabilized in 2017.</li>}
        {!!output.hpdComplaintCount && <li>It has {output.hpdComplaintCount} HPD complaints.</li>}
        {!!output.hpdOpenViolationCount && <li>It has {output.hpdOpenViolationCount} open HPD violations.</li>}
        {output.hasStabilizedUnits && <li>The building has had at least one rent-stabilized unit at some point. If you live there, you can find out for sure by <a href="https://www.justfix.nyc/#rental-history" target="_blank" rel="noopener noreferrer">getting your rental history</a>.</li>}
        {output.averageWaitTimeForRepairsAtBbl && <li>For this building, the average time it takes for the landlord to repair a problem once it has been reported as a violation is {output.averageWaitTimeForRepairsAtBbl} days.</li>}
        {output.averageWaitTimeForRepairsForPortfolio && <li>Across the landlord's portfolio, the average time it takes for the landlord to repair a problem once it has been reported as a violation is {output.averageWaitTimeForRepairsForPortfolio} days.</li>}
        <li>Learn more at <WhoOwnsWhatLink bbl={output.bbl}>Who Owns What</WhoOwnsWhatLink>.</li>
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
        <SyncQuerystringToFields routeInfo={props} fields={[
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
