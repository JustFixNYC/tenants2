import React, { useContext } from "react";
import Page from "../../ui/page";
import { AppContext } from "../../app-context";
import { OutboundLink } from "../../analytics/google-analytics";
import {
  getUSStateChoiceLabels,
  USStateChoice,
} from "../../../../common-data/us-state-choices";
import { LetterBuilderAccordion } from "./welcome";
import { getNorentMetadataForUSState } from "./national-metadata";
import classnames from "classnames";
import { USPS_TRACKING_URL_PREFIX } from "../../../../common-data/loc.json";
import { NorentRequireLoginStep } from "./step-decorators";
import { NorentNonpaymentDocumentation } from "../data/faqs-content";
import { SocialIcons } from "../components/social-icons";

const checkCircleSvg = require("../../svg/check-circle-solid.svg") as JSX.Element;

const NATIONAL_LEGAL_AID_URL = "https://www.lawhelp.org";
const CANCEL_RENT_PETITION_URL = "https://cancelrent.us/";
const MH_ACTION_URL =
  "https://actionnetwork.org/forms/join-mhactions-fight-to-ensure-all-families-have-a-place-to-call-home/";
const NORENT_FEEDBACK_FORM_URL = "https://airtable.com/shrrnQD3kXUQv1xm3";

export const NorentConfirmation = NorentRequireLoginStep(() => {
  const { session } = useContext(AppContext);
  const letter = session.norentLatestLetter;
  const state =
    session.onboardingInfo?.state &&
    (session.onboardingInfo.state as USStateChoice);
  const stateName = state && getUSStateChoiceLabels()[state];

  // Content from national metadata:
  const needsDocumentation =
    state &&
    getNorentMetadataForUSState(state)?.docs?.isDocumentationALegalRequirement;

  const needsToSendLandlord =
    state &&
    getNorentMetadataForUSState(state)?.docs
      ?.doesTheTenantNeedToSendTheDocumentationToTheLandlord;

  const numDaysToSend =
    state &&
    getNorentMetadataForUSState(state)?.docs
      ?.numberOfDaysFromNonPaymentNoticeToProvideDocumentation;

  const legalAidLink =
    (state &&
      getNorentMetadataForUSState(state)?.legalAid
        ?.localLegalAidProviderLink) ||
    NATIONAL_LEGAL_AID_URL;

  return (
    <Page
      title="You've sent your letter"
      className="content jf-norent-letter-confirmation"
    >
      <div className="media">
        <div className="media-left">
          <i className="has-text-info">{checkCircleSvg}</i>
        </div>
        <div className="media-content">
          <h2 className="title">You've sent your letter</h2>
        </div>
      </div>
      {letter?.trackingNumber ? (
        <>
          <p>
            Your letter has been mailed to your landlord via USPS Certified
            Mail. A copy of your letter has also been sent to your email.
          </p>
          <p>
            <span className="is-size-5 has-text-weight-bold">
              USPS Tracking #:
            </span>{" "}
            <OutboundLink
              href={`${USPS_TRACKING_URL_PREFIX}${letter.trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="is-size-5 is-size-6-mobile"
            >
              {letter.trackingNumber}
            </OutboundLink>
          </p>
        </>
      ) : (
        <p>
          Your letter has been sent to your landlord via email. A copy of your
          letter has also been sent to your email.
        </p>
      )}
      <h2 className="title is-spaced has-text-info">What happens next?</h2>
      <h3 className="title jf-alt-title-font">Gather documentation</h3>
      <p
        className={classnames(
          !(stateName && needsDocumentation) && "is-marginless"
        )}
      >
        While you wait for your landlord to respond, gather as much
        documentation as you can. This can include a letter from your employer,
        receipts, doctor’s notes etc.
      </p>
      <>
        {stateName && needsDocumentation && (
          <p className="is-marginless">
            {stateName} has specific documentation requirements to support your
            letter to your landlord.
          </p>
        )}
        {stateName && (
          <LetterBuilderAccordion question="Find out more">
            <article className="message">
              <div className="message-body has-background-grey-lighter has-text-left">
                {needsToSendLandlord && (
                  <p>
                    In {stateName}, you have{" "}
                    {numDaysToSend && (
                      <span className="has-text-weight-bold">
                        {numDaysToSend} days{" "}
                      </span>
                    )}
                    to send documentation to your landlord proving you can’t pay
                    rent.
                  </p>
                )}
                <div className="jf-is-nonpayment-documentation">
                  <NorentNonpaymentDocumentation />
                </div>
              </div>
            </article>
          </LetterBuilderAccordion>
        )}
      </>
      <h3 className="title jf-alt-title-font">
        Contact a lawyer if your landlord retaliates
      </h3>
      <p>
        It’s possible that your landlord will retaliate once they’ve received
        your letter. This is illegal. Contact{" "}
        <OutboundLink
          className="has-text-weight-normal"
          href={legalAidLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          your local legal aid provider
        </OutboundLink>{" "}
        for assistance.
      </p>
      <br />
      <h2 className="title is-spaced has-text-info">More resources</h2>
      <h3 className="title jf-alt-title-font">Build power in numbers</h3>
      <p>
        Our homes, health, and collective safety and futures are on the line.
        Millions of us don’t know how we are going to pay our rent, mortgage, or
        utilities on May 1st, yet landlords and banks are expecting payment as
        if it’s business as usual. It’s not.
      </p>
      <p>
        Join millions of us to fight for a future free from debt and to win a
        national suspension on rent, mortgage and utility payments!
      </p>
      <p className="has-text-centered">
        <OutboundLink
          className="button is-primary is-large jf-is-extra-wide"
          href={CANCEL_RENT_PETITION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Sign the petition
        </OutboundLink>
      </p>
      <h3 className="title jf-alt-title-font">
        Mobile/Manufactured Home Residents
      </h3>
      <p>
        Click here to join MHAction’s movement to hold corporate community
        owners accountable.
      </p>
      <p className="has-text-centered">
        <OutboundLink
          className="button is-primary is-large jf-is-extra-wide"
          href={MH_ACTION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to website
        </OutboundLink>
      </p>
      <br />
      <h2 className="title is-spaced has-text-info">Give us feedback</h2>
      <p>
        This tool is provided by JustFix.nyc. We’re a non-profit that creates
        tools for tenants and the housing rights movement. We always want
        feedback to improve our tools.
      </p>
      <p className="has-text-centered">
        <OutboundLink
          className="button is-primary is-large jf-is-extra-wide"
          href={NORENT_FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Give feedback
        </OutboundLink>
      </p>
      <br />
      <br />
      <h5 className="has-text-centered is-uppercase has-text-weight-normal">
        Share this tool
      </h5>
      <SocialIcons linksAreForSharing />
    </Page>
  );
});
