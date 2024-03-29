import React, { useContext } from "react";
import Page from "../../ui/page";
import { AppContext } from "../../app-context";
import { OutboundLink } from "../../ui/outbound-link";
import {
  getUSStateChoiceLabels,
  USStateChoice,
} from "../../../../common-data/us-state-choices";
import { Accordion } from "../../ui/accordion";
import { getNorentMetadataForUSState } from "./national-metadata";
import classnames from "classnames";
import { USPS_TRACKING_URL_PREFIX } from "../../../../common-data/loc";
import { NorentRequireLoginStep } from "./step-decorators";
import { NorentNonpaymentDocumentation } from "../data/faqs-content";
import { SocialIcons, SocialShareContent } from "../components/social-icons";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { friendlyUTCDate } from "../../util/date-util";
import { NorentMoreLettersBlurb } from "./more-letters";

const checkCircleSvg = require("../../svg/check-circle-solid.svg") as JSX.Element;

export const NATIONAL_LEGAL_AID_URL = "https://www.lawhelp.org";
export const CANCEL_RENT_PETITION_URL = "https://cancelrent.us/";
export const MH_ACTION_URL =
  "https://actionnetwork.org/forms/join-mhactions-fight-to-ensure-all-families-have-a-place-to-call-home/";
export const NORENT_FEEDBACK_FORM_URL =
  "https://airtable.com/shrrnQD3kXUQv1xm3";

const NorentSocialShareContent: SocialShareContent = {
  tweet: t(
    "norent.tweetTemplateForSharingNoRent"
  )`No idea how you'll pay rent this month? Tell your landlord with norent.org from @JustFixNYC. This free tool sends a certified letter informing them of your protections. Join the #cancelrent movement at norent.org.`,
  emailSubject: t`I just used JustFix's new free tool to tell my landlord I can't pay rent`,
  emailBody: t(
    "norent.emailBodyTemplateForSharingNoRent"
  )`I used www.norent.org to tell my landlord that I'm unable to pay this month's rent. This free tool helps you build and send a letter to your landlord, cites legal protections in your state, and connects you to other people in your community working to #cancelrent`,
};

export const NorentConfirmation = NorentRequireLoginStep(() => {
  const { session } = useContext(AppContext);
  const letter = session.norentLatestLetter;
  const isInLA = session.onboardingInfo?.isInLosAngeles;
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

  const legalAidLink = isInLA
    ? "https://www.stayhousedla.org/"
    : (state &&
        getNorentMetadataForUSState(state)?.legalAid
          ?.localLegalAidProviderLink) ||
      NATIONAL_LEGAL_AID_URL;

  return (
    <Page
      title={li18n._(t`You've sent your letter`)}
      className="content jf-norent-letter-confirmation"
    >
      <div className="media">
        <div className="media-left">
          <i className="has-text-info">{checkCircleSvg}</i>
        </div>
        <div className="media-content">
          <h2 className="title">
            <Trans>You've sent your letter</Trans>
          </h2>
        </div>
      </div>
      {letter?.trackingNumber ? (
        <>
          <p>
            <Trans>
              Your letter has been mailed to your landlord via USPS Certified
              Mail. A copy of your letter has also been sent to your email.
            </Trans>
          </p>
        </>
      ) : (
        <p>
          <Trans>
            Your letter has been sent to your landlord via email. A copy of your
            letter has also been sent to your email.
          </Trans>
        </p>
      )}
      <p>
        <strong>
          <Trans>
            Check your email for additional important information on next steps.
          </Trans>
        </strong>
      </p>
      {letter?.trackingNumber && letter?.letterSentAt && (
        <>
          <h2 className="title is-spaced has-text-info">
            <Trans>Details about your latest letter</Trans>
          </h2>
          <p>
            <Trans>
              Your letter was sent on {friendlyUTCDate(letter.letterSentAt)}.
            </Trans>
          </p>
          <p>
            <span className="is-size-5 has-text-weight-bold">
              <Trans>USPS Tracking #:</Trans>
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
      )}
      <h2 className="title is-spaced has-text-info">
        <Trans>What happens next?</Trans>
      </h2>
      <h3 className="title jf-alt-title-font">
        <Trans>Gather documentation</Trans>
      </h3>
      <p
        className={classnames(
          !(stateName && needsDocumentation) && "is-marginless"
        )}
      >
        <Trans>
          While you wait for your landlord to respond, gather as much
          documentation as you can. This can include a letter from your
          employer, receipts, doctor’s notes etc.
        </Trans>
      </p>
      <>
        {stateName && needsDocumentation && (
          <p className="is-marginless">
            <Trans>
              {stateName} has specific documentation requirements to support
              your letter to your landlord.
            </Trans>
          </p>
        )}
        {stateName && (
          <Accordion question={li18n._(t`Find out more`)}>
            <article className="message">
              <div className="message-body has-background-grey-lighter has-text-left">
                {needsToSendLandlord && (
                  <p>
                    {numDaysToSend ? (
                      <Trans>
                        In {stateName}, you have{" "}
                        <span className="has-text-weight-bold">
                          {numDaysToSend} days{" "}
                        </span>
                        to send documentation to your landlord proving you can’t
                        pay rent.
                      </Trans>
                    ) : (
                      <Trans>
                        In {stateName}, you have to send documentation to your
                        landlord proving you can’t pay rent.
                      </Trans>
                    )}
                  </p>
                )}
                <div className="jf-is-nonpayment-documentation">
                  <NorentNonpaymentDocumentation />
                </div>
              </div>
            </article>
          </Accordion>
        )}
      </>
      <h3 className="title jf-alt-title-font">
        <Trans>Contact a lawyer if your landlord retaliates</Trans>
      </h3>
      <p>
        <Trans>
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
        </Trans>
      </p>
      <br />
      <h2 className="title is-spaced has-text-info">
        <Trans>Need to send another letter?</Trans>
      </h2>
      <NorentMoreLettersBlurb />
      <br />
      <h2 className="title is-spaced has-text-info">
        <Trans>More resources</Trans>
      </h2>
      <h3 className="title jf-alt-title-font">
        <Trans>Build power in numbers</Trans>
      </h3>
      <Trans id="norent.callToActionForCancelRentCampaign">
        <p>
          Our homes, health, and collective safety and futures are on the line.
          Millions of us don’t know how we are going to pay our rent, mortgage,
          or utilities on June 1st, yet landlords and banks are expecting
          payment as if it’s business as usual. It’s not.
        </p>
        <p>
          Join millions of us to fight for a future free from debt and to win a
          national suspension on rent, mortgage and utility payments!
        </p>
      </Trans>
      <p className="has-text-centered">
        <OutboundLink
          className="button is-primary is-large jf-is-extra-wide"
          href={CANCEL_RENT_PETITION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Trans>Sign the petition</Trans>
        </OutboundLink>
      </p>
      <h3 className="title jf-alt-title-font">
        <Trans>Mobile/Manufactured Home Residents</Trans>
      </h3>
      <p>
        <Trans>
          Click here to join MHAction’s movement to hold corporate community
          owners accountable.
        </Trans>
      </p>
      <p className="has-text-centered">
        <OutboundLink
          className="button is-primary is-large jf-is-extra-wide"
          href={MH_ACTION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Trans>Go to website</Trans>
        </OutboundLink>
      </p>
      <br />
      <h2 className="title is-spaced has-text-info">
        <Trans>Give us feedback</Trans>
      </h2>
      <p>
        <Trans>
          This tool is provided by JustFix. We’re a non-profit that creates
          tools for tenants and the housing rights movement. We always want
          feedback to improve our tools.
        </Trans>
      </p>
      <p className="has-text-centered">
        <OutboundLink
          className="button is-primary is-large jf-is-extra-wide"
          href={NORENT_FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Trans>Give feedback</Trans>
        </OutboundLink>
      </p>
      <br />
      <br />
      <h5 className="has-text-centered is-uppercase has-text-weight-normal">
        <Trans>Share this tool</Trans>
      </h5>
      <SocialIcons socialShareContent={NorentSocialShareContent} />
    </Page>
  );
});
