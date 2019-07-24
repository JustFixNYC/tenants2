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
import { Link } from 'react-router-dom';

type DDOData = DataDrivenOnboardingSuggestions_output;

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

type ActionCardProps = {
  title?: string,
  indicators: (JSX.Element | 0 | false | null)[],
  cta: JSX.Element
};

type ActionCardPropsCreator = (data: DDOData) => ActionCardProps;

function ActionCard(props: ActionCardProps) {
  return (
    <div className="card">
      <div className="card-content">
        {props.title && <p className="title">{props.title}</p>}
        {props.indicators.map((indicator, i) => (
          indicator ? <p key={i} className="subtitle">{indicator}</p> : null
        ))}
      </div>
      <div className="card-footer">
        <p className="card-footer-item">
          <span>
            {props.cta}
          </span>
        </p>
      </div>
    </div>
  );
}

const ACTION_CARDS: ActionCardPropsCreator[] = [
  function whoOwnsWhat({fullAddress, bbl, associatedBuildingCount, portfolioUnitCount, unitCount}) {
    return {
      title: fullAddress,
      indicators: [
        associatedBuildingCount && portfolioUnitCount && <p className="subtitle">
          Your landlord owns <Indicator value={associatedBuildingCount} unit="building"/> and <Indicator value={portfolioUnitCount} unit="unit"/>.
        </p>,
        unitCount && <p className="subtitle">
          There <Indicator verb="is/are" value={unitCount} unit="unit" /> in your building.
        </p>,  
      ],
      cta: <WhoOwnsWhatLink bbl={bbl}>Learn more at Who Owns What</WhoOwnsWhatLink>
    };
  },
  function letterOfComplaint(data) {
    return {
      indicators: [
        data.hpdComplaintCount && <>There <Indicator verb="has been/have been" value={data.hpdComplaintCount || 0} unit="HPD complaint"/> in your building since 2014.</>
      ],
      cta: <Link to={Routes.locale.home}>Send a letter of complaint</Link>
    };
  },
  function hpAction(data) {
    return {
      indicators: [
        data.hpdOpenViolationCount && <>There <Indicator verb="is/are" value={data.hpdOpenViolationCount || 0} unit="open violation"/> in your building.</>
      ],
      cta: <Link to={Routes.locale.hp.splash}>Sue your landlord</Link>
    }
  },
  function rentHistory(data) {
    return {
      indicators: [
        (data.hasStabilizedUnits || data.stabilizedUnitCount2007 || data.stabilizedUnitCount2017)
        ? <>
          Your apartment may be rent stabilized.
        </> : null,
        data.stabilizedUnitCount2017 && <>
          Your building had <Indicator value={data.stabilizedUnitCount2017} unit="rent stabilized unit" /> in 2017.
        </>,
      ],
      cta: <a href="https://www.justfix.nyc/#rental-history" rel="noopener noreferrer" target="_blank">Order your rental history</a>
    };
  },
  function evictionFreeNyc(data) {
    return {
      indicators: [
        data.isRtcEligible && <>You might be eligible for a free attorney if you are being evicted.</>,
      ],
      cta: <a href="https://www.evictionfreenyc.org/" rel="noopener noreferrer" target="_blank">Fight an eviction</a>
    }
  }
];

function FoundResults(props: DDOData) {
  const actionCardProps = ACTION_CARDS.map(propsCreator => propsCreator(props));
  const recommendedActions: ActionCardProps[] = [];
  const otherActions: ActionCardProps[] = [];

  actionCardProps.forEach(props => {
    if (props.indicators.some(value => !!value)) {
      recommendedActions.push(props);
    } else {
      otherActions.push(props);
    }
  });

  return <>
    {recommendedActions.map((props, i) => <ActionCard key={i} {...props} />)}
    {otherActions.length > 0 && <>
      <h2>Other actions</h2>
      <ul>
        {otherActions.map((props, i) => <li key={i}>{props.cta}</li>)}
      </ul>
    </>}
  </>;
}

function Results(props: {
  address: string,
  output: DDOData|null,
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
