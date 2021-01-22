import React from "react";
import { OutboundLink } from "../../analytics/google-analytics";
import { ProgressStepProps } from "../../progress/progress-step-route";
import { USPS_TRACKING_URL_PREFIX } from "../../../../common-data/loc.json";
import Page from "../../ui/page";
import { getGlobalAppServerInfo } from "../../app-context";
import { friendlyUTCDate } from "../../util/date-util";
import { PdfLink } from "../../ui/pdf-link";

// TO DO: Replace this tracking number with the user's actual one
const SAMPLE_USPS_TRACKING_NUMBER = "129837127326123";

const HCA_HOTLINE_PHONE_LINK = "tel:+12129624795";
const NYC_311_CONTACT_LINK =
  "https://portal.311.nyc.gov/article/?kanumber=KA-02498";

const LIST_OF_ORGANIZING_GROUPS_URL =
  "https://d3n8a8pro7vhmx.cloudfront.net/righttocounselnyc/pages/1232/attachments/original/1590279936/List_of_Tenant_Organizing_Groups_Across_NY_State.pdf?1590279936";

const checkCircleSvg = require("../../svg/check-circle-solid.svg") as JSX.Element;

const renderTitleWithCheckCircle = (title: string) => (
  <div className="media">
    <div className="media-left">
      <i className="has-text-info">{checkCircleSvg}</i>
    </div>
    <div className="media-content">
      <h2 className="title is-size-4-mobile">{title}</h2>
    </div>
  </div>
);

const RetaliationBlurb = () => (
  <>
    <h2 className="title is-spaced">
      Contact a lawyer if your landlord retaliates
    </h2>
    <p>
      It’s possible that your landlord will retaliate once they’ve received your
      letter. This is illegal. Contact the City's Tenant Helpline (which can
      provide free advice and legal counsel to tenants) by{" "}
      <OutboundLink
        href={NYC_311_CONTACT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="jf-word-glue"
      >
        calling 311
      </OutboundLink>
      .
    </p>
  </>
);

const HcaHotlineBlurb = () => (
  <>
    {" "}
    <h2 className="title is-spaced">Need additional support?</h2>
    <p>
      Call the Housing Court Answers hotline at{" "}
      <OutboundLink
        href={HCA_HOTLINE_PHONE_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="jf-word-glue"
      >
        212-962-4795
      </OutboundLink>
      .
    </p>
    <p>
      Hours of operation: Monday to Friday, 9am - 5pm. Available in English and
      Spanish.
    </p>
  </>
);

const OrganizingGroupsBlurb = () => (
  <>
    {" "}
    <h2 className="title is-spaced">Join the fight to cancel rent</h2>
    <p>
      Get involved in your local community organization! Join millions in the
      fight for a future free from debt and to win a cancelation of rent,
      mortgage and utility payments.
    </p>
    <p className="has-text-centered">
      <OutboundLink
        className="button is-primary is-large jf-is-extra-wide"
        href={LIST_OF_ORGANIZING_GROUPS_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        View list of organizations →
      </OutboundLink>
    </p>
    <p className="is-size-6">
      <br />
      *Due to the COVID-19 pandemic, some offices are closed and may not answer
      phones.
    </p>
  </>
);

export const EvictionFreeDbConfirmation: React.FC<ProgressStepProps> = (
  props
) => {
  // TODO: This should be the URL to the finished declaration, *not* the preview.
  const pdfLink = getGlobalAppServerInfo().previewHardshipDeclarationURL;

  // TODO: This should be the actual send date of the letter.
  const sendDate = new Date().toISOString();

  return (
    <Page
      title="You've sent your hardship declaration"
      className="content"
      withHeading={renderTitleWithCheckCircle}
    >
      <p>
        {/* TO DO: Dynamically show "email" and "USPS Certified Mail" based on user actions */}
        Your declaration has been sent to your landlord via email and USPS
        Certified Mail. A copy of the declaration has also been sent to your
        local court via email in order to ensure they have it on record if your
        landlord attempts to initiate an eviction case.
      </p>
      <p>
        Check your email for a message containing a copy of your declaration and
        additional important information on next steps.
      </p>
      <h2 className="title is-spaced">Details about your declaration</h2>
      <p>Your letter was sent on {friendlyUTCDate(sendDate)}. </p>
      <p>
        <span className="is-size-5 has-text-weight-bold">USPS Tracking #:</span>{" "}
        <OutboundLink
          href={`${USPS_TRACKING_URL_PREFIX}${SAMPLE_USPS_TRACKING_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="is-size-5 is-size-6-mobile"
        >
          {SAMPLE_USPS_TRACKING_NUMBER}
        </OutboundLink>
      </p>
      <br />
      <PdfLink href={pdfLink} label="Download completed declaration" />
      {/* TO DO: Only show the following two sections if user is in NYC
          by checking if session.onboardingInfo.borough is falsy */}
      <>
        <RetaliationBlurb />
        <HcaHotlineBlurb />
      </>

      <OrganizingGroupsBlurb />
    </Page>
  );
};
