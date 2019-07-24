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

function Indicator(props: {value: number, unit: string, pluralUnit?: string, verb?: string}) {
  const num = new Intl.NumberFormat('en-US');
  const { value, unit } = props;
  const isSingular = value === 1;
  let pluralUnit = props.pluralUnit || `${unit}s`;
  let verb = props.verb;

  if (verb) {
    const [singVerb, pluralVerb] = verb.split('/');
    verb = isSingular ? `${singVerb} ` : `${pluralVerb} `;
  }

  return <>
    {verb}{num.format(value)} {isSingular ? unit : pluralUnit}
  </>;
}

function GeneralAddressInfoCard(props: DataDrivenOnboardingSuggestions_output) {
  let { associatedBuildingCount, portfolioUnitCount, unitCount} = props;

  return (
    <div className="card">
      <div className="card-content">
        <p className="title">{props.fullAddress}</p>
        {associatedBuildingCount && portfolioUnitCount && <p className="subtitle">
          Your landlord owns <Indicator value={associatedBuildingCount} unit="building"/> and <Indicator value={portfolioUnitCount} unit="unit"/>.
        </p>}
        {unitCount && <p className="subtitle">
          There <Indicator verb="is/are" value={unitCount} unit="unit" /> in your building.
        </p>}
      </div>
      <div className="card-footer">
        <p className="card-footer-item">
          <span>
            Learn more at <WhoOwnsWhatLink bbl={props.bbl}>Who Owns What</WhoOwnsWhatLink>
          </span>
        </p>
      </div>
    </div>
  );
}

function FoundResults(props: DataDrivenOnboardingSuggestions_output) {
  return (
    <GeneralAddressInfoCard {...props} />
  );
}

function Results(props: {
  address: string,
  output: DataDrivenOnboardingSuggestions_output|null,
}) {
  let content = null;
  if (props.output) {
    content = <FoundResults {...props.output} />;
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
          addressLabel="Enter your address and we'll give you some cool info."
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
