import React, { useState, useEffect, useContext } from "react";
import classnames from "classnames";
import JustfixRoutes from "../justfix-route-info";
import { RouteComponentProps } from "react-router";
import Page, { PageTitle } from "../ui/page";
import {
  DataDrivenOnboardingSuggestions,
  DataDrivenOnboardingSuggestions_output,
} from "../queries/DataDrivenOnboardingSuggestions";
import { NextButton } from "../ui/buttons";
import { FormContext } from "../forms/form-context";
import { whoOwnsWhatURL } from "../ui/wow-link";
import { AddressAndBoroughField } from "../forms/address-and-borough-form-field";
import { Link } from "react-router-dom";
import {
  QueryFormSubmitter,
  useQueryFormResultFocusProps,
} from "../forms/query-form-submitter";
import { AppContext, getGlobalAppServerInfo } from "../app-context";
import { properNoun } from "../util/util";
import { ga } from "../analytics/google-analytics";
import { OutboundLink } from "../ui/outbound-link";
import { UpdateBrowserStorage } from "../browser-storage";
import { getEmergencyHPAIssueLabels } from "../hpaction/emergency/emergency-hp-action-issues";
import { Trans, t, Plural } from "@lingui/macro";
import { EnglishOutboundLink } from "../ui/localized-outbound-link";
import { li18n } from "../i18n-lingui";
import { evictionfreeURL } from "../ui/evictionfree-link";
import { fbq } from "../analytics/facebook-pixel";

const CTA_CLASS_NAME = "button is-primary jf-text-wrap";

const SHOW_PLACEHOLDER_IMG = process.env.NODE_ENV !== "production";

const PLACEHOLDER_IMG = "frontend/img/96x96.png";

const MAX_RECOMMENDED_ACTIONS = 3;

const EVICTIONFREE_PRIORITY = 100;
const VIOLATIONS_PRIORITY = 50;
const VIOLATIONS_HIGH_PRIORITY = 50;
const COMPLAINTS_PRIORITY = 40;
const WOW_PRIORITY = 20;
const RENT_HISTORY_PRIORITY = 10;

// This flag disables any DDO cards from appearing as "Recommended Actions"
// When "true", all cards show up under a single header called "Actions"
const DISABLE_RECOMMENDATIONS = true;

type DDOData = DataDrivenOnboardingSuggestions_output;

function AutoSubmitter(props: { autoSubmit: boolean; ctx: FormContext<any> }) {
  useEffect(() => {
    if (props.autoSubmit) {
      props.ctx.submit();
    }
    // The following deps are legacy code that has been working for months;
    // we don't want to break it by satisfying eslint now.
    // eslint-disable-next-line
  }, [props.autoSubmit]);

  return null;
}

/**
 * Calculate the given value per unit, defaulting to zero if the
 * value isn't available or something else is amiss.
 */
function calcPerUnit(value: number | null, data: DDOData): number {
  if (data.unitCount === 0 || value === null) return 0;
  return value / data.unitCount;
}

type CallToActionProps = {
  to: string;
  text: string;
  gaLabel: string;
  isBeta?: boolean;
  className?: string;
};

type PossibleIndicator = JSX.Element | 0 | false | null | "";

type ActionCardProps = {
  cardClass?: string;
  titleProps?: JSX.IntrinsicElements["h3"];
  title?: string;
  indicators: PossibleIndicator[];
  fallbackMessage: JSX.Element;
  cta?: CallToActionProps;
  imageStaticURL?: string;
  priority?: number;
  isRecommended?: boolean;
};

type ActionCardPropsCreator = (data: DDOData) => ActionCardProps;

function CallToAction({
  to,
  text,
  isBeta,
  className,
  gaLabel,
}: CallToActionProps) {
  const isInternal = to[0] === "/";
  const betaTag = isBeta ? <span className="jf-beta-tag" /> : null;
  const content = (
    <>
      {text}
      {betaTag}
    </>
  );
  const onClick = () => ga("send", "event", "ddo-action", "click", gaLabel);
  if (isInternal) {
    return (
      <Link to={to} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <OutboundLink
      href={to}
      rel="noopener noreferrer"
      target="_blank"
      className={className}
      onClick={onClick}
    >
      {content}
    </OutboundLink>
  );
}

function useStaticURL(path: string): string {
  const { staticURL } = useContext(AppContext).server;
  return `${staticURL}${path}`;
}

type SquareImageProps = {
  size: 16 | 24 | 32 | 48 | 64 | 96 | 128;
  src: string;
  alt: string;
  className?: string;
};

export function SquareImage(props: SquareImageProps) {
  const { size } = props;

  // https://bulma.io/documentation/elements/image/

  return (
    <figure
      className={classnames("image", `is-${size}x${size}`, props.className)}
    >
      <img src={useStaticURL(props.src)} alt={props.alt} />
    </figure>
  );
}

function ActionCardIndicators(
  props: Pick<ActionCardProps, "indicators" | "fallbackMessage">
) {
  const indicators: JSX.Element[] = [];

  props.indicators.forEach((ind) => ind && indicators.push(ind));
  if (indicators.length === 0) {
    indicators.push(props.fallbackMessage);
  }

  return (
    <>
      {indicators.map((indicator, i) => (
        <p key={i} className="subtitle is-spaced">
          {indicator}
        </p>
      ))}
    </>
  );
}

function ActionCard(props: ActionCardProps) {
  return (
    <>
      <div className={classnames("card", "jf-ddo-card", props.cardClass)}>
        <div className="card-content">
          <div className="media">
            <div className="media-content">
              {props.title && (
                <h3 className="title is-spaced is-size-4" {...props.titleProps}>
                  {props.imageStaticURL && (
                    <SquareImage
                      size={64}
                      src={props.imageStaticURL}
                      alt=""
                      className="is-pulled-right jf-is-supertiny-only"
                    />
                  )}
                  {props.title}
                </h3>
              )}
              <ActionCardIndicators {...props} />
              {props.cta && (
                <CallToAction {...props.cta} className={CTA_CLASS_NAME} />
              )}
            </div>
            {props.imageStaticURL && (
              <div className="media-right jf-is-hidden-supertiny">
                <SquareImage
                  size={128}
                  className="is-marginless"
                  src={props.imageStaticURL}
                  alt=""
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function isBuildingClassBorC(buildingClass: string | null): boolean {
  return /^(B|C).*/i.test(buildingClass || "");
}

function getUnitsAndDateBuilt(
  data: DataDrivenOnboardingSuggestions_output
): PossibleIndicator[] {
  return [
    data.unitCount && (
      <Trans>
        There{" "}
        <Plural value={data.unitCount} one="is one unit" other="are # units" />{" "}
        in your building.
      </Trans>
    ),
    // Note that we don't *actually* need some of these prerequsites, but it looks weird to have
    // just the build date as an indicator, so we'll only show it if we also show other info.
    data.unitCount && data.yearBuilt && (
      <Trans>Your building was built in {data.yearBuilt} or earlier.</Trans>
    ),
  ];
}

const useBuildingIntroCard: ActionCardPropsCreator = (
  data
): ActionCardProps => {
  const hasHpdRegistration =
    data.associatedBuildingCount && data.associatedBuildingCount > 0;
  return {
    title: data.fullAddress,
    titleProps: {
      className: "title is-spaced is-size-3",
      ...useQueryFormResultFocusProps(),
    },
    cardClass: "has-background-light",
    indicators: data.isNychaBbl
      ? [
          // Note that this might be a RAD conversion, but since the owner is still technically NYCHA,
          // it is indeed still best to show the following info.
          <Trans>
            This building is owned by the{" "}
            <strong>NYC Housing Authority (NYCHA)</strong>.
          </Trans>,
          ...getUnitsAndDateBuilt(data),
        ]
      : hasHpdRegistration
      ? [
          data.associatedBuildingCount && data.portfolioUnitCount && (
            <Trans>
              Your landlord owns{" "}
              <Plural
                value={data.associatedBuildingCount}
                one="one building"
                other="# buildings"
              />{" "}
              and{" "}
              <Plural
                value={data.portfolioUnitCount}
                one="one unit."
                other="# units."
              />
            </Trans>
          ),
          ...getUnitsAndDateBuilt(data),
        ]
      : isBuildingClassBorC(data.buildingClass)
      ? [
          <>
            <span className="jf-registration-warning">
              <span className="has-text-danger has-text-weight-semibold">
                <Trans>No registration found.</Trans>
              </span>{" "}
              <Trans> Your landlord may be breaking the law!</Trans>
            </span>
            <Trans id="justfix.DdoMayNeedHpdRegistration">
              It looks like this building may require registration with HPD.
              Landlords who don't properly register their properties incur fines
              and also cannot bring tenants to court for nonpayment of rent. You
              can find more information on{" "}
              <EnglishOutboundLink href="https://www1.nyc.gov/site/hpd/services-and-information/register-your-property.page">
                HPD's Property Management page
              </EnglishOutboundLink>
            </Trans>
            .
          </>,
        ]
      : [
          <>
            <span className="jf-registration-warning has-text-danger has-text-weight-semibold">
              <Trans>No registration found.</Trans>
            </span>
            <Trans>
              {" "}
              It doesn't seem like this property is required to register with
              HPD. You can learn about the City's registration requirements on{" "}
              <EnglishOutboundLink href="https://www1.nyc.gov/site/hpd/services-and-information/register-your-property.page">
                HPD's Property Management page
              </EnglishOutboundLink>
              .
            </Trans>
          </>,
        ],
    // This fallback message should never actually appear, as the indicators have been constructed
    // in such a way that there should be at least one non-falsy one.
    fallbackMessage: <></>,
  };
};

function commaSeparatedConjunction(items: string[]): string {
  return items
    .map((item, i) =>
      i === items.length - 1 ? li18n._(t`and`) + ` ${item}` : item
    )
    .join(", ");
}

const ACTION_CARDS: ActionCardPropsCreator[] = [
  function whoOwnsWhat(data): ActionCardProps {
    const buildings = data.associatedBuildingCount || 0;
    const hasMinBuildings = buildings > 1;

    return {
      title: li18n._(t`Research your landlord`),
      priority: WOW_PRIORITY,
      isRecommended: buildings > 25,
      indicators: [
        hasMinBuildings && (
          <Trans>
            Your landlord is associated with{" "}
            <Plural value={buildings} one="one building" other="# buildings" />.
          </Trans>
        ),
        data.associatedZipCount && hasMinBuildings && (
          <Trans>
            Buildings in your landlord's portfolio are located in{" "}
            <Plural
              value={data.associatedZipCount}
              one="one zip code."
              other="# zip codes."
            />
          </Trans>
        ),
        data.portfolioTopBorough && hasMinBuildings && (
          <Trans>
            The majority of your landlord's properties are concentrated in{" "}
            {properNoun(data.portfolioTopBorough)}.
          </Trans>
        ),
      ],
      fallbackMessage: (
        <Trans> Your landlord might own other buildings, too. </Trans>
      ),
      imageStaticURL: "frontend/img/ddo/network.svg",
      cta: {
        to: whoOwnsWhatURL(data.bbl),
        gaLabel: "wow",
        text: li18n._(t`Visit Who Owns What`),
      },
    };
  },
  function letterOfComplaint(data): ActionCardProps {
    // Default content temporarily implemented during COVID-19 Outbreak
    const covidMessage = (
      <Trans id="justfix.ddoLocCovidMessage">
        Landlord not responding? You can take action for free to request
        repairs! Due to the Covid-19 health crisis, we recommend requesting
        repairs only in the case of an emergency so you can stay safe and
        healthy by limiting how many people enter your home.
      </Trans>
    );
    return {
      title: li18n._(t`Request repairs from your landlord`),
      priority: COMPLAINTS_PRIORITY,
      isRecommended:
        (data.hpdComplaintCount || 0) > 5 ||
        calcPerUnit(data.hpdComplaintCount, data) > 0.8,
      indicators: [covidMessage],
      fallbackMessage: covidMessage,
      imageStaticURL: "frontend/img/ddo/letter.svg",
      cta: {
        to: JustfixRoutes.locale.loc.latestStep,
        gaLabel: "loc",
        text: li18n._(t`Send a letter of complaint`),
      },
    };
  },
  function hpAction(data): ActionCardProps {
    // Default content temporarily implemented during COVID-19 Outbreak
    const normalCovidMessage = (
      <Trans id="justfix.ddoHpaCovidMessage">
        <span className="subtitle">
          Due to the Covid-19 health crisis, Housing Courts in New York City are
          closed. You can still make the forms to take your landlord to court
          but you will not be able to file them until the courts re-open.
        </span>
        <span className="subtitle">
          If you are facing an emergency such as lack of heat and/or hot water,
          call the Housing Court Answers Hotline at{" "}
          <a href="tel:1-212-962-4795">(212) 962-4795</a> to get assistance
          Mon-Fri, 9am-5pm. Assistance is available in English and Spanish.
        </span>
      </Trans>
    );
    let issues = commaSeparatedConjunction(
      getEmergencyHPAIssueLabels().map((v) => v.toLowerCase())
    );
    const emergencyCovidMessage = (
      <Trans id="justfix.ddoEhpaCovidMessage">
        <span className="subtitle">
          Due to the covid-19 pandemic, Housing Courts in New York City are
          prioritizing cases for conditions that threaten the health and safety
          of your household, such as: {issues}.
        </span>
      </Trans>
    );
    const normalHpAction: ActionCardProps = {
      title: li18n._(t`Start a legal case for repairs and/or harassment`),
      priority:
        (data.hpdOpenClassCViolationCount || 0) > 2
          ? VIOLATIONS_HIGH_PRIORITY
          : VIOLATIONS_PRIORITY,
      isRecommended:
        data.hpdOpenViolationCount > 2 ||
        calcPerUnit(data.hpdOpenViolationCount, data) > 0.7 ||
        data.numberOfTotalHpdViolations > 10 ||
        calcPerUnit(data.numberOfTotalHpdViolations, data) > 1.6 ||
        (data.hpdOpenClassCViolationCount || 0) > 0,
      indicators: [normalCovidMessage],
      fallbackMessage: normalCovidMessage,
      imageStaticURL: "frontend/img/ddo/legal.svg",
      cta: {
        to: JustfixRoutes.locale.hp.latestStep,
        gaLabel: "hp",
        text: li18n._(t`Sue your landlord`),
        isBeta: true,
      },
    };

    return getGlobalAppServerInfo().enableEmergencyHPAction
      ? {
          ...normalHpAction,
          title: li18n._(t`Start an emergency legal case for repairs`),
          indicators: [emergencyCovidMessage],
          fallbackMessage: emergencyCovidMessage,
          cta: {
            to: JustfixRoutes.locale.ehp.latestStep,
            gaLabel: "ehp",
            text: li18n._(t`Sue your landlord`),
            isBeta: true,
          },
        }
      : normalHpAction;
  },
  function rentHistory(data): ActionCardProps {
    return {
      title: li18n._(t`Learn about your rent`),
      priority: RENT_HISTORY_PRIORITY,
      isRecommended: data.unitCount > 6 || (data.yearBuilt || Infinity) < 1974,
      indicators: [
        data.stabilizedUnitCountMaximum > 0 ||
        data.stabilizedUnitCount2007 ||
        data.stabilizedUnitCount ? (
          <Trans>Your apartment may be rent stabilized.</Trans>
        ) : null,
        data.stabilizedUnitCount && (
          <Trans>
            Your building had{" "}
            <Plural
              value={data.stabilizedUnitCount}
              one="one rent stabilized unit"
              other="# rent stabilized units"
            />{" "}
            in {data.stabilizedUnitCountYear}.
          </Trans>
        ),
      ],
      fallbackMessage: (
        <Trans>
          Think your apartment may be rent-stabilized? Request its official
          records.
        </Trans>
      ),
      imageStaticURL: "frontend/img/ddo/rent.svg",
      cta: {
        to: JustfixRoutes.locale.rh.splash,
        gaLabel: "rh",
        text: li18n._(t`Order rent history`),
      },
    };
  },
  function evictionFreeNy(data): ActionCardProps {
    const covidMessage = (
      <Trans id="justfix.ddoEvictionfreeCovidMessage">
        You can send a hardship declaration form to your landlord and local
        courts— putting your eviction case on hold until May 1st, 2021.
      </Trans>
    );
    return {
      title: li18n._(t`Protect yourself from eviction`),
      priority: EVICTIONFREE_PRIORITY,
      isRecommended:
        data.isRtcEligible && (data.numberOfEvictionsFromPortfolio || 0) > 0,
      indicators: [covidMessage],
      fallbackMessage: covidMessage,
      imageStaticURL: "frontend/img/ddo/judge.svg",
      cta: {
        to: evictionfreeURL(),
        gaLabel: "evictionfree",
        text: li18n._(t`Learn more`),
      },
    };
  },
];

function compareActionCardProps(
  a: ActionCardProps,
  b: ActionCardProps
): number {
  return (b.priority || 0) - (a.priority || 0);
}

function getSortedActionCards(
  data: DDOData
): { recommended: ActionCardProps[]; other: ActionCardProps[] } {
  const actionCardProps = ACTION_CARDS.map((propsCreator) =>
    propsCreator(data)
  ).map((props) => {
    if (DISABLE_RECOMMENDATIONS) {
      props.isRecommended = false;
    }
    return props.imageStaticURL
      ? props
      : {
          ...props,
          imageStaticURL: SHOW_PLACEHOLDER_IMG ? PLACEHOLDER_IMG : undefined,
        };
  });

  const recommended: ActionCardProps[] = [];
  const other: ActionCardProps[] = [];

  actionCardProps.forEach((props) => {
    if (
      props.indicators.some((value) => !!value) &&
      props.isRecommended !== false
    ) {
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

  return (
    <>
      <PageTitle title={li18n._(t`Results for ${props.fullAddress}`)} />
      <ActionCard {...useBuildingIntroCard(props)} />
      {actions.recommended.length > 0 && (
        <>
          <h2>
            <Trans>Recommended actions</Trans>
          </h2>
          {actions.recommended.map((props, i) => (
            <ActionCard key={i} {...props} />
          ))}
        </>
      )}
      {actions.other.length > 0 && (
        <>
          <h2>
            {actions.recommended.length > 0
              ? li18n._(t`More actions`)
              : li18n._(t`Actions`)}
          </h2>
          {actions.other.map((props, i) => (
            <ActionCard key={i} {...props} />
          ))}
        </>
      )}
    </>
  );
}

function Results(props: { address: string; output: DDOData | null }) {
  let content = null;
  const queryFormResultFocusProps = useQueryFormResultFocusProps();
  if (props.output) {
    content = <DataDrivenOnboardingResults {...props.output} />;
  } else if (props.address.trim()) {
    content = (
      <>
        <PageTitle title={li18n._(t`Unrecognized address`)} />
        <h3 {...queryFormResultFocusProps}>
          <Trans>Sorry, we don't recognize the address you entered.</Trans>
        </h3>
      </>
    );
  }
  return (
    <div className="content jf-ddo-results jf-fadein-half-second">
      {content}
    </div>
  );
}

const TrackDDOSearch: React.FC<{}> = () => {
  useEffect(() => {
    fbq("trackCustom", "DDOSearch");
  }, []);
  return null;
};

export default function DataDrivenOnboardingPage(props: RouteComponentProps) {
  const appCtx = useContext(AppContext);
  const emptyInput = { address: "", borough: "" };
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
        {(ctx, latestInput, latestOutput) => {
          const showHero = !latestInput.address;
          const { isSafeModeEnabled } = appCtx.session;
          const address = ctx.fieldPropsFor("address").value;
          const borough = ctx.fieldPropsFor("borough").value;

          return (
            <section className={showHero ? "hero" : ""}>
              {address && <TrackDDOSearch key={address + borough} />}
              <div className={showHero ? "hero-body" : ""}>
                {showHero && (
                  <Trans>
                    <h1 className="title is-size-1 is-size-3-mobile is-spaced">
                      Free tools for you to fight for a safe and healthy home
                    </h1>
                    <p className="subtitle">
                      Enter your address to learn more.
                    </p>
                  </Trans>
                )}
                <div
                  className={classnames(
                    "jf-ddo-searchbar",
                    !isSafeModeEnabled && "level"
                  )}
                >
                  <AddressAndBoroughField
                    key={props.location.search}
                    addressLabel={li18n._(
                      t`Enter your address to see some recommended actions.`
                    )}
                    renderAddressLabel={(label, props) => (
                      <label
                        {...props}
                        className={showHero ? "jf-sr-only" : "label"}
                      >
                        {label}
                      </label>
                    )}
                    hideBoroughField={
                      appCtx.session.isSafeModeEnabled ? false : true
                    }
                    addressProps={ctx.fieldPropsFor("address")}
                    boroughProps={ctx.fieldPropsFor("borough")}
                    onChange={() => setAutoSubmit(true)}
                  />
                  <AutoSubmitter ctx={ctx} autoSubmit={autoSubmit} />
                  <NextButton
                    label={li18n._(t`Search address`)}
                    buttonSizeClass="is-normal"
                    isLoading={ctx.isLoading}
                  />
                </div>
                {latestOutput !== undefined && (
                  <>
                    <UpdateBrowserStorage
                      latestAddress={address}
                      latestBorough={borough}
                    />
                    <Results address={address} output={latestOutput} />
                  </>
                )}
              </div>
            </section>
          );
        }}
      </QueryFormSubmitter>
    </Page>
  );
}
