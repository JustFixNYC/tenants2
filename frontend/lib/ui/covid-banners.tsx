import React, { useState } from "react";
import { SimpleProgressiveEnhancement } from "./progressive-enhancement";
import classnames from "classnames";
import { Icon } from "./icon";
import { OutboundLink } from "./outbound-link";
import { getEmergencyHPAIssueLabels } from "../hpaction/emergency/emergency-hp-action-issues";
import { CSSTransition } from "react-transition-group";
import JustfixRoutes from "../justfix-route-info";
import { useDebouncedValue } from "../util/use-debounced-value";
import { SupportedLocaleMap } from "../i18n";
import { CovidMoratoriumBanner } from "@justfixnyc/react-common";
import { li18n } from "../i18n-lingui";
import { EvictionFreeRoutes } from "../evictionfree/route-info";

export const MORATORIUM_FAQ_URL: SupportedLocaleMap<string> = {
  en:
    "https://d3n8a8pro7vhmx.cloudfront.net/righttocounselnyc/pages/191/attachments/original/1602806977/Eviction_Moratorium__New_Evictions__and_Pre_Covid_Lawsuits__FAQ_Last_Updated_10_9.pdf?1602806977",
  es:
    "https://docs.google.com/document/d/1uzT1lduZAzNLpy_WxSOU1oSOTOPs0YrWekzLd8o6tAs/edit",
};

const getRoutesWithMoratoriumBanner = () => [
  JustfixRoutes.locale.loc.splash,
  JustfixRoutes.locale.hp.splash,
  JustfixRoutes.locale.ehp.splash,
  JustfixRoutes.locale.rh.splash,
  JustfixRoutes.locale.home,
  EvictionFreeRoutes.locale.home,
  EvictionFreeRoutes.locale.about,
  EvictionFreeRoutes.locale.faqs,
];

/**
 * This banner component is intended to show right below the navbar on certain pages.
 */
export const WarningBanner = (props: {
  pathname?: string;
  children: React.ReactNode;
}) => {
  // This has to be debounced or it weirdly collides with our loading overlay
  // that appears when pages need to load JS bundles and such, so we'll add a
  // short debounce, which seems to obviate this issue.
  const includeBanner = useDebouncedValue(
    props.pathname && getRoutesWithMoratoriumBanner().includes(props.pathname),
    10
  );

  const [isVisible, setVisibility] = useState(true);

  const show = !!includeBanner && isVisible;

  return (
    <CSSTransition
      in={show}
      unmountOnExit
      classNames="jf-slide-500px-200ms"
      timeout={200}
    >
      <section
        className={classnames(
          "jf-moratorium-banner",
          "hero",
          "is-warning",
          "is-small"
        )}
      >
        <div className="hero-body">
          <div className="container">
            <SimpleProgressiveEnhancement>
              <button
                className="delete is-medium is-pulled-right"
                onClick={() => setVisibility(false)}
              />
            </SimpleProgressiveEnhancement>
            <p>{props.children}</p>
          </div>
        </div>
      </section>
    </CSSTransition>
  );
};

/**
 * This banner is a general overview of how JustFix.nyc is adapting to the COVID-19 crisis
 * and Eviction Moratorium.
 */
const MoratoriumBanner = (props: { pathname?: string }) => (
  <WarningBanner pathname={props.pathname}>
    <CovidMoratoriumBanner locale={li18n.language} />
  </WarningBanner>
);

export default MoratoriumBanner;

/**
 * This banner serves as a notification for any Eviction Moratorium updated that relate specifically
 * to the Eviction Free NY tool.
 */
export const EvictionFreeMoratoriumBanner = (props: { pathname?: string }) => (
  <WarningBanner pathname={props.pathname}>
    <>
      <b>The Eviction Moratorium has been extended until August 31, 2021!</b>{" "}
      The courts haven't provided an updated Hardship Declaration form yet, but
      it is likely that forms submitted over the last few months will provide
      protection until the new August deadline. Check back here for updates in
      the next few days.{" "}
      <OutboundLink href="https://www.nysenate.gov/legislation/bills/2021/A7175">
        <b>
          <u>Learn more</u>
        </b>
      </OutboundLink>
    </>
  </WarningBanner>
);

/**
 * This banner is intended to show up within the Letter of Complaint flow
 * and makes users aware of the potential risks of requesting in-person repairs during the crisis.
 */

export const CovidRiskBanner = () => (
  <div className="notification is-warning">
    <p>
      Please be aware that letting a repair-worker into your home to make
      repairs may increase exposure to the COVID-19 virus.
    </p>
    <p>
      In order to follow social distancing guidelines and to limit exposure, we
      recommend only asking for repairs in the case of an emergency such as if
      you have no heat, no hot water, or no gas.
    </p>
  </div>
);

/**
 * This small warning is intended to notify folks about the current NY Moratorium on Evictions
 * in case their landlord is illegally trying evict them.
 */

export const MoratoriumWarning = () => (
  <div className="content has-text-centered is-size-7">
    <Icon type="notice" /> Have you been given an eviction notice?{" "}
    <strong>This is illegal.</strong> An Eviction Moratorium is currently in
    place across New York State.{" "}
    <OutboundLink href={MORATORIUM_FAQ_URL.en} target="_blank">
      <span className="has-text-primary jf-has-text-underline">Learn more</span>
    </OutboundLink>
  </div>
);

/**
 * This banner is intended to show up in the Emergency HP splash and welcome pages, listing
 * out the cases that are currently eligible for Emergency HP actions during the COVID-19 crisis.
 */

export const CovidEhpDisclaimer = () => {
  const acceptedEmergencyHpCases = getEmergencyHPAIssueLabels();
  const caseList = [...acceptedEmergencyHpCases, "Harassing you"].map((v) =>
    v.toLowerCase()
  );
  const numCases = caseList.length;
  const generateCaseList = (start: number, end: number) =>
    caseList
      .map((caseType, i) => <li key={i}> {caseType} </li>)
      .slice(start, end);
  return (
    <div className="jf-covid-ehp-disclaimer notification is-warning">
      <p>
        Due to the COVID-19 pandemic, Housing Courts in New York City are
        prioritizing cases for the following conditions,{" "}
        <strong>
          or others that threaten the health and safety of your household
        </strong>
        :
      </p>
      <div className="is-hidden-tablet">{generateCaseList(0, numCases)}</div>
      <div className="columns is-mobile is-hidden-mobile">
        <div className="column is-one-third">
          {generateCaseList(0, Math.round(numCases / 2))}
        </div>
        <div className="column">
          {generateCaseList(Math.round(numCases / 2), numCases)}
        </div>
      </div>
    </div>
  );
};
