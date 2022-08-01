import React, { useState } from "react";
import { SimpleProgressiveEnhancement } from "./progressive-enhancement";
import classnames from "classnames";
import { Icon } from "./icon";
import { OutboundLink } from "./outbound-link";
import { CSSTransition } from "react-transition-group";
import JustfixRoutes from "../justfix-route-info";
import { useDebouncedValue } from "../util/use-debounced-value";
import { SupportedLocaleMap } from "../i18n";
import { Trans } from "@lingui/macro";
import { EnglishOutboundLink } from "./localized-outbound-link";
import {
  documentToReactComponents,
  RenderNode,
} from "@contentful/rich-text-react-renderer";
import { useContentfulCommonString } from "../contentful";
import { INLINES } from "@contentful/rich-text-types";

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
];

const RENDER_NODE: RenderNode = {
  [INLINES.HYPERLINK]: (node, children) => (
    <a rel="noreferrer noopener" target="_blank" href={node.data.uri}>
      {children}
    </a>
  ),
};

/**
 * This banner is intended to show right below the navbar on certain pages and is a general
 * overview of how JustFix is adapting to the COVID-19 crisis and Eviction Moratorium.
 */

const MoratoriumBanner: React.FC<{ pathname?: string }> = (props) => {
  // This has to be debounced or it weirdly collides with our loading overlay
  // that appears when pages need to load JS bundles and such, so we'll add a
  // short debounce, which seems to obviate this issue.
  const includeBanner = useDebouncedValue(
    props.pathname && getRoutesWithMoratoriumBanner().includes(props.pathname),
    10
  );
  const [isVisible, setVisibility] = useState(true);
  const show = !!includeBanner && isVisible;
  const document = useContentfulCommonString("covidMoratoriumBanner");

  return (
    document && (
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
              {documentToReactComponents(document, {
                renderNode: RENDER_NODE,
              })}
            </div>
          </div>
        </section>
      </CSSTransition>
    )
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
 * out the current status of the EHP tool.
 */

const EHP_MEDIUM_URL =
  "https://justfixnyc.medium.com/housing-court-blocks-tenants-from-suing-their-landlords-d7b9e3629a32";
const HCA_URL =
  "http://housingcourtanswers.org/answers/for-tenants/hp-actions-tenants/";

export const CovidEhpDisclaimerText = () => (
  <Trans id="justfix.ddoEhpaDeactivatedMessage">
    Since June 2021, Housing Court has blocked tenants from suing their landlord
    through JustFix’s HP Action Tool. To learn how to file an HP Action now,
    read our{" "}
    <EnglishOutboundLink href={EHP_MEDIUM_URL}>
      Medium article
    </EnglishOutboundLink>
    . To learn more about HP Actions and find a list of legal providers, visit{" "}
    <EnglishOutboundLink href={HCA_URL}>
      Housing Court Answers
    </EnglishOutboundLink>
    .
  </Trans>
);

export const CovidEhpDisclaimer = () => {
  return (
    <div className="jf-covid-ehp-disclaimer notification is-warning">
      <p>
        <CovidEhpDisclaimerText />
      </p>
    </div>
  );
};
