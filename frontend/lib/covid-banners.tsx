import React, { useState } from 'react'
import { SimpleProgressiveEnhancement } from './progressive-enhancement';
import classnames from 'classnames';
import { Icon } from './icon';
import { OutboundLink } from './google-analytics';
import { getEmergencyHPAIssueLabels } from './emergency-hp-action-issues';

const ROUTES_WITH_MORATORIUM_BANNER = [
    "/loc/splash",
    "/hp/splash",
    "/rh/splash",
    "/"
  ];

/**
 * This banner is intended to show right below the navbar on certain pages and is a general 
 * overview of how JustFix.nyc is adapting to the COVID-19 crisis and Eviction Moratorium.
 */  
const MoratoriumBanner = ( props:{ pathname?: string } ) => {

    const includeBanner = props.pathname && (ROUTES_WITH_MORATORIUM_BANNER.includes(props.pathname));
    
    const [isVisible, setVisibility] = useState(true);

    return (includeBanner ? 
    <section className={classnames("jf-moratorium-banner","hero","is-warning", "is-small", !isVisible && "is-hidden")}>
        <div className="hero-body">
        <div className="container">
            <SimpleProgressiveEnhancement>
                <button className="delete is-medium is-pulled-right" onClick = {() => setVisibility(false)} />
            </SimpleProgressiveEnhancement>
            <p>
                <span className="has-text-weight-bold">COVID-19 Update: </span>
                JustFix.nyc remains in operation, and we are adapting our products to match new rules put in place during the Covid-19 public health crisis. 
                Thanks to organizing from tenant leaders, renters now have stronger protections during this time, including a full halt on eviction cases. 
                {' '}<a href="https://www.righttocounselnyc.org/moratorium_faq" target="_blank" rel="noopener noreferrer">
                    <span className="has-text-weight-bold">Learn more</span>
                </a>
            </p>
        </div>
        </div>
    </section> : <></>
    );
}

export default MoratoriumBanner;

/**
 * This banner is intended to show up within the Letter of Complaint flow
 * and makes users aware of the potential risks of requesting in-person repairs during the crisis.
 */ 
export const CovidRiskBanner = () => (
    <div className="notification is-warning">
      <p>
        Please be aware that letting a repair-worker into your home to make repairs may expose you to the Covid-19 virus. 
      </p>
      <p>
        In order to follow social distancing guidelines and to limit your exposure, we recommend only asking for repairs in the case of an emergency such as if you have no heat, no hot water, or no gas.
      </p>
    </div>
  );

/**
 * This small warning is intended to notify folks about the current NY Moratorium on Evictions
 * in case their landlord is illegally trying evict them.
 */ 
export const MoratoriumWarning = () => (
    <div className="content has-text-centered is-size-7">
        <Icon type="notice" />{' '}Have you been given an eviction notice? <strong>This is illegal.</strong> An Eviction Moratorium is currently in place across New York State. 
        {' '}<OutboundLink href="https://www.righttocounselnyc.org/moratorium_faq" target="_blank"><span className="has-text-primary jf-has-text-underline">Learn more</span></OutboundLink>
    </div>
)

/**
 * This banner is intended to show up in the Emergency HP splash and welcome pages, listing  
 * out the cases that are currently eligible for Emergency HP actions during the Covid-19 crisis.
 */  
export const CovidEhpDisclaimer = () => {
  const acceptedEmergencyHpCases = getEmergencyHPAIssueLabels();
  const numCases = acceptedEmergencyHpCases.length;
  const generateCaseList = (start: number, end: number) => 
    acceptedEmergencyHpCases.map((caseType, i) => <li key={i}> {caseType} </li>).slice(start, end);
  return (
    <div className="jf-covid-ehp-disclaimer notification is-warning">
      <p>Due to the covid-19 pandemic, Housing Courts in New York City are only accepting cases for the following, or other conditions that threaten the health and safety of your household:</p>
      <div className="is-hidden-tablet">
        {generateCaseList(0,numCases)}
      </div>
      <div className="columns is-mobile is-hidden-mobile">
        <div className="column is-one-third">
          {generateCaseList(0,Math.round(numCases / 2))}
        </div>
        <div className="column">
          {generateCaseList(Math.round(numCases / 2), numCases)}
        </div>
      </div>
    </div>
  );
}