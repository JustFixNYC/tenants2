import React, { useState, useEffect, useContext } from 'react';
import classnames from 'classnames';
import Routes from "../routes";
import { RouteComponentProps, Route } from "react-router";
import Page, { PageTitle } from "../page";
import { DataDrivenOnboardingSuggestions, DataDrivenOnboardingSuggestions_output } from '../queries/DataDrivenOnboardingSuggestions';
import { NextButton } from '../buttons';
import { FormContext } from '../form-context';
import { whoOwnsWhatURL } from '../wow-link';
import { AddressAndBoroughField } from '../address-and-borough-form-field';
import { Link } from 'react-router-dom';
import { QueryFormSubmitter, useQueryFormResultFocusProps } from '../query-form-submitter';
import { AppContext } from '../app-context';
import { properNoun } from '../util';
import { OutboundLink } from '../google-analytics';

const CTA_CLASS_NAME = "button is-primary jf-text-wrap";

const SHOW_PLACEHOLDER_IMG = process.env.NODE_ENV !== 'production';

const PLACEHOLDER_IMG = 'frontend/img/96x96.png';

const MAX_RECOMMENDED_ACTIONS = 3;

const EFNYC_PRIORITY = 50;
const VIOLATIONS_HIGH_PRIORITY = 45;
const COMPLAINTS_PRIORITY = 40;
const VIOLATIONS_PRIORITY = 30;
const RENT_HISTORY_PRIORITY = 20;
const WOW_PRIORITY = 10;

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

/**
 * Calculate the given value per unit, defaulting to zero if the
 * value isn't available or something else is amiss.
 */
function calcPerUnit(value: number|null, data: DDOData): number {
  if (data.unitCount === 0 || value === null) return 0;
  return value / data.unitCount;
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
  titleProps?: JSX.IntrinsicElements["h3"],
  title?: string,
  indicators: (JSX.Element | 0 | false | null | "")[],
  fallbackMessage: JSX.Element,
  cta?: CallToActionProps,
  imageStaticURL?: string,
  priority?: number,
  isRecommended?: boolean
};

type ActionCardPropsCreator = (data: DDOData) => ActionCardProps;

function CallToAction({to, text, className}: CallToActionProps) {
  const isInternal = to[0] === '/';
  if (isInternal) {
    return <Link to={to} className={className}>{text}</Link>;
  }
  return <OutboundLink href={to} rel="noopener noreferrer" target="_blank" className={className}>
    {text}
  </OutboundLink>;
}

function useStaticURL(path: string): string {
  const { staticURL } = useContext(AppContext).server;
  return `${staticURL}${path}`;
}

type SquareImageProps = {
  size: 16|24|32|48|64|96|128,
  src: string,
  alt: string,
  className?: string
};

function SquareImage(props: SquareImageProps) {
  const { size } = props;

  // https://bulma.io/documentation/elements/image/

  return (
    <figure className={classnames('image', `is-${size}x${size}`, props.className)}>
      <img src={useStaticURL(props.src)} alt={props.alt} />
    </figure>
  );
}

function ActionCardIndicators(props: Pick<ActionCardProps, 'indicators'|'fallbackMessage'>) {
  const indicators: JSX.Element[] = [];

  props.indicators.forEach(ind => ind && indicators.push(ind));
  if (indicators.length === 0) {
    indicators.push(props.fallbackMessage);
  }

  return <>
    {indicators.map((indicator, i) => (
      <p key={i} className="subtitle is-spaced">{indicator}</p>
    ))}
  </>;
}

function ActionCard(props: ActionCardProps) {
  return <>
    <div className={classnames('card', 'jf-ddo-card', props.cardClass)}>
      <div className="card-content">
        <div className="media">
          <div className="media-content">
            {props.title && <h3 className="title is-spaced is-size-4" {...props.titleProps}>
              {props.imageStaticURL && <SquareImage size={64} src={props.imageStaticURL} alt="" className="is-pulled-right jf-is-supertiny-only"/>}
              {props.title}
            </h3>}
            <ActionCardIndicators {...props} />
            {props.cta && <CallToAction {...props.cta} className={CTA_CLASS_NAME} />}
          </div>
          {props.imageStaticURL && <div className="media-right jf-is-hidden-supertiny">
            <SquareImage size={128} className="is-marginless" src={props.imageStaticURL} alt="" />
          </div>}
        </div>
      </div>
    </div>
  </>;
}

const buildingIntroCard: ActionCardPropsCreator = (data): ActionCardProps => ({
  title: data.fullAddress,
  titleProps: {
    className: 'title is-spaced is-size-3',
    ...useQueryFormResultFocusProps()
  },
  cardClass: 'has-background-light',
  indicators: [
    data.associatedBuildingCount && data.portfolioUnitCount && <>
      Your landlord owns <Indicator value={data.associatedBuildingCount} unit="building"/> and <Indicator value={data.portfolioUnitCount} unit="unit"/>.
    </>,
    data.unitCount && <>
      There <Indicator verb="is/are" value={data.unitCount} unit="unit" /> in your building.
    </>,
    // Note that we don't *actually* need some of these prerequsites, but it looks weird to have
    // just the build date as an indicator, so we'll only show it if we also show other info.
    data.unitCount && data.yearBuilt && <>
      Your building was built in {data.yearBuilt} or earlier.
    </>
  ],
  fallbackMessage: <>This building isn't registered with the NYC Department of Housing Preservation and Development (HPD), so we don't know much about it.</>
});

const ACTION_CARDS: ActionCardPropsCreator[] = [
  function whoOwnsWhat(data): ActionCardProps {
    const buildings = data.associatedBuildingCount || 0;
    const hasMinBuildings = buildings > 1;

    return {
      title: "Research your landlord",
      priority: WOW_PRIORITY,
      isRecommended: buildings > 25,
      indicators: [
        hasMinBuildings && <>
          Your landlord is associated with <Indicator value={buildings} unit="property" pluralUnit="properties" />.
        </>,
        data.associatedZipCount && hasMinBuildings && <>
          Buildings in your landlord's portfolio are located in <Indicator value={data.associatedZipCount} unit="zip code" />.
        </>,
        data.portfolioTopBorough && hasMinBuildings && <>
          The majority of your landlord's properties are concentrated in {properNoun(data.portfolioTopBorough)}.
        </>
      ],
      fallbackMessage: <>
        Your landlord might own other buildings, too.
      </>,
      imageStaticURL: "frontend/img/ddo/network.svg",
      cta: {
        to: whoOwnsWhatURL(data.bbl),
        text: "Visit Who Owns What"
      }
    };
  },
  function letterOfComplaint(data): ActionCardProps {
    return {
      title: 'Request repairs from your landlord',
      priority: COMPLAINTS_PRIORITY,
      isRecommended: (data.hpdComplaintCount || 0) > 5 || calcPerUnit(data.hpdComplaintCount, data) > 0.8,
      indicators: [
        data.hpdComplaintCount && <>There <Indicator verb="has been/have been" value={data.hpdComplaintCount || 0} unit="HPD complaint"/> in your building since 2014.</>,
        data.mostCommonCategoryOfHpdComplaint && data.numberOfComplaintsOfMostCommonCategory && <>The most common category of complaint is <strong>{data.mostCommonCategoryOfHpdComplaint.toLowerCase()}</strong>, with <Indicator value={data.numberOfComplaintsOfMostCommonCategory} unit="complaint" />.</>
      ],
      fallbackMessage: <>
        Landlord not responding? You can take action for free!
      </>,
      imageStaticURL: "frontend/img/ddo/letter.svg",
      cta: {
        to: Routes.locale.home,
        text: "Send a letter of complaint",
      }
    };
  },
  function hpAction(data): ActionCardProps {
    return {
      title: 'Start a legal case for repairs and/or harassment',
      priority: (data.hpdOpenClassCViolationCount || 0) > 2 ? VIOLATIONS_HIGH_PRIORITY : VIOLATIONS_PRIORITY,
      isRecommended: (
        (data.hpdOpenViolationCount > 2 || calcPerUnit(data.hpdOpenViolationCount, data) > 0.7) ||
        (data.numberOfTotalHpdViolations > 10 || calcPerUnit(data.numberOfTotalHpdViolations, data) > 1.6) ||
        ((data.hpdOpenClassCViolationCount || 0) > 0)
      ),
      indicators: [
        <>There <Indicator verb="is/are" value={data.hpdOpenViolationCount} unit="open violation"/> in your building.</>,
        <>The city has issued <Indicator value={data.numberOfTotalHpdViolations} unit="total violation"/> since 2010.</>,
        data.averageWaitTimeForRepairsAtBbl && <>The average violation in your building takes <Indicator value={data.averageWaitTimeForRepairsAtBbl} unit="day" /> to be resolved.</>
      ],
      fallbackMessage: <>
        Going to court can help you get repairs.
      </>,
      imageStaticURL: "frontend/img/ddo/judge.svg",
      cta: {
        to: Routes.locale.hp.latestStep,
        text: "Sue your landlord"
      }
    }
  },
  function rentHistory(data): ActionCardProps {
    return {
      title: 'Learn about your rent',
      priority: RENT_HISTORY_PRIORITY,
      isRecommended: data.unitCount > 6 || ((data.yearBuilt || Infinity) < 1974),
      indicators: [
        (data.stabilizedUnitCountMaximum > 0 || data.stabilizedUnitCount2007 || data.stabilizedUnitCount2017)
        ? <>
          Your apartment may be rent stabilized.
        </> : null,
        data.stabilizedUnitCount2017 && <>
          Your building had <Indicator value={data.stabilizedUnitCount2017} unit="rent stabilized unit" /> in 2017.
        </>,
      ],
      fallbackMessage: <>
        Think your apartment may be rent-stabilized? Request its official records.
      </>,
      imageStaticURL: "frontend/img/ddo/rent.svg",
      cta: {
        to: "https://www.justfix.nyc/#rental-history",
        text: "Order rental history"
      }
    };
  },
  function evictionFreeNyc(data): ActionCardProps {
    return {
      title: 'Fight an eviction',
      priority: EFNYC_PRIORITY,
      isRecommended: data.isRtcEligible && (data.numberOfEvictionsFromPortfolio || 0) > 0,
      indicators: [
        data.isRtcEligible && <>You might be eligible for a free attorney if you are being evicted.</>,
      ],
      fallbackMessage: <>
        Are you facing eviction? Learn how to respond and where to find help.
      </>,
      imageStaticURL: "frontend/img/ddo/legal.svg",
      cta: {
        to: "https://www.evictionfreenyc.org/",
        text: "Visit Eviction Free NYC"
      }
    }
  }
];

function compareActionCardProps(a: ActionCardProps, b: ActionCardProps): number {
  return (b.priority || 0) - (a.priority || 0);
}

function getSortedActionCards(data: DDOData): { recommended: ActionCardProps[], other: ActionCardProps[] } {
  const actionCardProps = ACTION_CARDS.map(propsCreator => propsCreator(data)).map(props => (
    props.imageStaticURL ? props : {...props, imageStaticURL: SHOW_PLACEHOLDER_IMG ? PLACEHOLDER_IMG : undefined}
  ));

  const recommended: ActionCardProps[] = [];
  const other: ActionCardProps[] = [];

  actionCardProps.forEach(props => {
    if (props.indicators.some(value => !!value) && props.isRecommended !== false) {
      recommended.push(props);
    } else {
      other.push(props);
    }
  });

  recommended.sort(compareActionCardProps);
  other.sort(compareActionCardProps);

  if (recommended.length > MAX_RECOMMENDED_ACTIONS) {
    const overflow = recommended.splice(MAX_RECOMMENDED_ACTIONS);
    other.push(...overflow);
    other.sort(compareActionCardProps);
  }

  return { recommended, other };
}

export function DataDrivenOnboardingResults(props: DDOData) {
  const actions = getSortedActionCards(props);

  return <>
    <PageTitle title={`Results for ${props.fullAddress}`} />
    <ActionCard {...buildingIntroCard(props)} />
    {actions.recommended.length > 0 && <>
      <h2>Recommended actions</h2>
      {actions.recommended.map((props, i) => <ActionCard key={i} {...props} />)}
    </>}
    {actions.other.length > 0 && <>
      <h2>{actions.recommended.length > 0 ? "More actions" : "Actions"}</h2>
      {actions.other.map((props, i) => <ActionCard key={i} {...props} />)}
    </>}
  </>;
}

function Results(props: {
  address: string,
  output: DDOData|null,
}) {
  let content = null;
  if (props.output) {
    content = <DataDrivenOnboardingResults {...props.output} />;
  } else if (props.address.trim()) {
    content = <>
      <PageTitle title="Unrecognized address" />
      <h3 {...useQueryFormResultFocusProps()}>Sorry, we don't recognize the address you entered.</h3>
    </>;
  }
  return <div className="content jf-ddo-results jf-fadein-half-second">
    {content}
  </div>;
}

function DataDrivenOnboardingPage(props: RouteComponentProps) {
  const appCtx = useContext(AppContext);
  const emptyInput = {address: '', borough: ''};
  const [autoSubmit, setAutoSubmit] = useState(false);

  return (
    <Page title="">
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
            hideBoroughField={appCtx.session.isSafeModeEnabled ? false : true}
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
