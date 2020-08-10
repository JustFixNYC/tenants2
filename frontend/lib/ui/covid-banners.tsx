import React, { useState } from "react";
import { SimpleProgressiveEnhancement } from "./progressive-enhancement";
import classnames from "classnames";
import { Icon } from "./icon";
import { OutboundLink } from "../analytics/google-analytics";
import { getEmergencyHPAIssueLabels } from "../hpaction/emergency-hp-action-issues";
import { CSSTransition } from "react-transition-group";
import JustfixRoutes from "../justfix-routes";
import { useDebouncedValue } from "../util/use-debounced-value";
import { Trans } from "@lingui/macro";
import { LocalizedOutboundLink } from "./localized-outbound-link";
import { SupportedLocaleMap } from "../i18n";

export const MORATORIUM_FAQ_URL: SupportedLocaleMap<string> = {
  en: "https://www.righttocounselnyc.org/ny_eviction_moratorium_faq",
  es: "https://www.righttocounselnyc.org/moratoria_de_desalojo",
};

const getRoutesWithMoratoriumBanner = () => [
  JustfixRoutes.locale.loc.splash,
  JustfixRoutes.locale.hp.splash,
  JustfixRoutes.locale.ehp.splash,
  JustfixRoutes.locale.rh.splash,
  JustfixRoutes.locale.home,
];

/**
 * This banner is intended to show right below the navbar on certain pages and is a general
 * overview of how JustFix.nyc is adapting to the COVID-19 crisis and Eviction Moratorium.
 */

const MoratoriumBanner = (props: { pathname?: string }) => {
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
            <p>
              <span className="has-text-weight-bold">
                <Trans>COVID-19 Update:</Trans>{" "}
              </span>
              <Trans id="justfix.covidBanner2">
                JustFix.nyc is operating, and has adapted our products to match
                preliminary rules put in place during the COVID-19 crisis. We
                recommend you take full precautions to stay safe during this
                public health crisis. Thanks to tenant organizing during this
                time, renters cannot be evicted for any reason. Visit{" "}
                <LocalizedOutboundLink hrefs={MORATORIUM_FAQ_URL}>
                  Right to Council’s Eviction Moratorium FAQs
                </LocalizedOutboundLink>{" "}
                to learn more.
              </Trans>
            </p>
          </div>
        </div>
      </section>
    </CSSTransition>
  );
};

export default MoratoriumBanner;

/**
 * This banner is intended to show up within the Letter of Complaint flow
 * and makes users aware of the potential risks of requesting in-person repairs during the crisis.
 */

export const CovidRiskBanner = () => (
  <div className="notification is-warning">
    <p>
      Please be aware that letting a repair-worker into your home to make
      repairs may expose you to the Covid-19 virus.
    </p>
    <p>
      In order to follow social distancing guidelines and to limit your
      exposure, we recommend only asking for repairs in the case of an emergency
      such as if you have no heat, no hot water, or no gas.
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
 * out the cases that are currently eligible for Emergency HP actions during the Covid-19 crisis.
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
        Due to the covid-19 pandemic, Housing Courts in New York City are only
        accepting cases for the following conditions,{" "}
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
