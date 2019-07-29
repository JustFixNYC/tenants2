import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import Routes from "../routes";
import { RouteComponentProps, Route } from "react-router";
import Page, { PageTitle } from "../page";
import { DataDrivenOnboardingSuggestions, DataDrivenOnboardingSuggestions_output } from '../queries/DataDrivenOnboardingSuggestions';
import { NextButton } from '../buttons';
import { FormContext } from '../form-context';
import { whoOwnsWhatURL } from '../tests/wow-link';
import { AddressAndBoroughField } from '../address-and-borough-form-field';
import { Link } from 'react-router-dom';
import { QueryFormSubmitter } from '../query-form-submitter';

const BASE_TITLE = "Data-driven onboarding";

const CTA_CLASS_NAME = "button is-primary";

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

type CallToActionProps = {
  to: string,
  text: string,
  className?: string
};

type ActionCardProps = {
  cardClass?: string,
  titleClass?: string,
  title?: string,
  indicators: (JSX.Element | 0 | false | null | "")[],
  cta: CallToActionProps
};

type ActionCardPropsCreator = (data: DDOData) => ActionCardProps;

function CallToAction({to, text, className}: CallToActionProps) {
  const isInternal = to[0] === '/';
  if (isInternal) {
    return <Link to={to} className={className}>{text}</Link>;
  }
  return <a href={to} rel="noopener noreferrer" target="_blank" className={className}>{text}</a>;
}

function ActionCard(props: ActionCardProps) {
  return <>
    <div className={classnames('card', 'jf-ddo-card', props.cardClass)}>
      <div className="card-content">
        {props.title && <p className={props.titleClass || 'title is-spaced is-size-4'}>{props.title}</p>}
        {props.indicators.map((indicator, i) => (
          indicator ? <p key={i} className="subtitle is-spaced">{indicator}</p> : null
        ))}
      </div>
      <div className="card-footer">
        <p className="card-footer-item">
          <span>
            <CallToAction {...props.cta} className={CTA_CLASS_NAME} />
          </span>
        </p>
      </div>
    </div>
    <br/>
  </>;
}

const ACTION_CARDS: ActionCardPropsCreator[] = [
  function whoOwnsWhat({fullAddress, bbl, associatedBuildingCount, portfolioUnitCount, unitCount}) {
    return {
      title: fullAddress,
      titleClass: 'title',
      cardClass: 'has-background-light',
      indicators: [
        associatedBuildingCount && portfolioUnitCount && <>
          Your landlord owns <Indicator value={associatedBuildingCount} unit="building"/> and <Indicator value={portfolioUnitCount} unit="unit"/>.
        </>,
        unitCount && <>
          There <Indicator verb="is/are" value={unitCount} unit="unit" /> in your building.
        </>,  
      ],
      cta: {
        to: whoOwnsWhatURL(bbl),
        text: "Learn more at Who Owns What"
      }
    };
  },
  function letterOfComplaint(data) {
    return {
      title: 'Complaints',
      indicators: [
        data.hpdComplaintCount && <>There <Indicator verb="has been/have been" value={data.hpdComplaintCount || 0} unit="HPD complaint"/> in your building since 2014.</>,
        data.mostCommonCategoryOfHpdComplaint && data.numberOfComplaintsOfMostCommonCategory && <>The most common category of complaint is <strong>{data.mostCommonCategoryOfHpdComplaint.toLowerCase()}</strong>, with <Indicator value={data.numberOfComplaintsOfMostCommonCategory} unit="complaint" />.</>
      ],
      cta: {
        to: Routes.locale.home,
        text: "Send a letter of complaint",
      }
    };
  },
  function hpAction(data) {
    return {
      title: 'Violations',
      indicators: [
        data.hpdOpenViolationCount && <>There <Indicator verb="is/are" value={data.hpdOpenViolationCount || 0} unit="open violation"/> in your building.</>,
        data.averageWaitTimeForRepairsAtBbl && <>Violations in your building take, on average, <Indicator value={data.averageWaitTimeForRepairsAtBbl} unit="day" /> to resolve.</>
      ],
      cta: {
        to: Routes.locale.hp.splash,
        text: "Sue your landlord"
      }
    }
  },
  function rentHistory(data) {
    return {
      title: 'Rent history',
      indicators: [
        (data.hasStabilizedUnits || data.stabilizedUnitCount2007 || data.stabilizedUnitCount2017)
        ? <>
          Your apartment may be rent stabilized.
        </> : null,
        data.stabilizedUnitCount2017 && <>
          Your building had <Indicator value={data.stabilizedUnitCount2017} unit="rent stabilized unit" /> in 2017.
        </>,
      ],
      cta: {
        to: "https://www.justfix.nyc/#rental-history",
        text: "Order your rental history"
      }
    };
  },
  function evictionFreeNyc(data) {
    return {
      title: 'Eviction defense',
      indicators: [
        data.isRtcEligible && <>You might be eligible for a free attorney if you are being evicted.</>,
      ],
      cta: {
        to: "https://www.evictionfreenyc.org/",
        text: "Fight an eviction"
      }
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
    <PageTitle title={`${BASE_TITLE} results for ${props.fullAddress}`} />
    {recommendedActions.map((props, i) => <ActionCard key={i} {...props} />)}
    {otherActions.length > 0 && <>
      <h2>Other actions</h2>
      <ul>
        {otherActions.map((props, i) => <li key={i}><CallToAction {...props.cta} /></li>)}
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
      <PageTitle title="Unrecognized address" />
      <p>Sorry, we don't recognize the address you entered.</p>
    </>;
  }
  return <div className="content">
    <br/>
    {content}
  </div>;
}

function DataDrivenOnboardingPage(props: RouteComponentProps) {
  const emptyInput = {address: '', borough: ''};
  const [autoSubmit, setAutoSubmit] = useState(false);

  return (
    <Page title={BASE_TITLE}>
      <QueryFormSubmitter
        {...props}
        emptyInput={emptyInput}
        emptyOutput={null}
        query={DataDrivenOnboardingSuggestions}
        onSubmit={() => setAutoSubmit(false)}
      >
        {(ctx, latestInput, latestOutput) => <>
          <AddressAndBoroughField
            key={props.location.search}
            addressLabel="Enter your address and we'll give you some cool info."
            addressProps={ctx.fieldPropsFor('address')}
            boroughProps={ctx.fieldPropsFor('borough')}
            onChange={() => setAutoSubmit(true)}
          />
          <AutoSubmitter ctx={ctx} autoSubmit={autoSubmit} />
          <NextButton label="Gimme some info" isLoading={ctx.isLoading} />
          {latestOutput !== undefined && <Results address={ctx.fieldPropsFor('address').value} output={latestOutput} />}
        </>}
      </QueryFormSubmitter>
    </Page>
  );
}

export default function DataDrivenOnboardingRoutes(): JSX.Element {
  return <Route path={Routes.locale.dataDrivenOnboarding} exact component={DataDrivenOnboardingPage} />;
}
