import React, { useContext } from "react";
import { OutboundLink } from "../../ui/outbound-link";
import { USPS_TRACKING_URL_PREFIX } from "../../../../common-data/loc";
import Page from "../../ui/page";
import { AppContext, getGlobalAppServerInfo } from "../../app-context";
import { friendlyUTCDate } from "../../util/date-util";
import { PdfLink } from "../../ui/pdf-link";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import { EvictionFreeRequireLoginStep } from "./step-decorators";
import { Redirect } from "react-router-dom";
import { assertNotNull } from "@justfixnyc/util";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { MessageDescriptor } from "@lingui/core";
import { SocialIcons } from "../../norent/components/social-icons";
import { EnglishOutboundLink } from "../../ui/localized-outbound-link";
import { RightToCounselFaqsLink } from "../data/faqs-content";
import { getEvictionMoratoriumEndDate } from "../homepage";

export const HCA_HOTLINE_PHONE_LINK = "tel:+12129624795";

const RENTAL_ASSISTANCE_HOTLINE_PHONE_LINK = "tel:+18446917368";

const NYC_311_CONTACT_LINK =
  "https://portal.311.nyc.gov/article/?kanumber=KA-02498";

const LIST_OF_ORGANIZING_GROUPS_URL =
  "https://d3n8a8pro7vhmx.cloudfront.net/righttocounselnyc/pages/1232/attachments/original/1590279936/List_of_Tenant_Organizing_Groups_Across_NY_State.pdf?1590279936";

const ERAP_APPLICATION_URL = "https://otda.ny.gov/ERAP";
const ERAP_LIST_OF_ASSISTING_GROUPS =
  "https://www1.nyc.gov/site/hra/help/new-york-emergency-rental-assistance-program-erap.page";

const H2_CLASSNAME = "title is-size-4 is-size-5-mobile is-spaced";

const checkCircleSvg = require("../../svg/check-circle-solid.svg") as JSX.Element;

const renderTitleWithCheckCircle = (title: string) => (
  <>
    <div className="has-text-centered is-hidden-tablet">
      <i className="has-text-info">{checkCircleSvg}</i>
    </div>
    <div className="media">
      <div className="media-left is-hidden-mobile">
        <i className="has-text-info">{checkCircleSvg}</i>
      </div>
      <div className="media-content">
        <h1 className="title">{title}</h1>
      </div>
    </div>
  </>
);

const RetaliationBlurb = () => (
  <>
    <h2 className={H2_CLASSNAME}>
      <Trans>Contact a lawyer if your landlord retaliates</Trans>
    </h2>
    <p>
      <Trans id="evictionfree.landlordRetaliationWarning">
        It’s possible that your landlord will retaliate once they’ve received
        your declaration. This is illegal. Contact the City's Tenant Helpline
        (which can provide free advice and legal counsel to tenants) by{" "}
        <OutboundLink
          href={NYC_311_CONTACT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="jf-word-glue"
        >
          calling 311
        </OutboundLink>
      </Trans>
      .
    </p>
  </>
);

const HcaHotlineBlurb = () => (
  <>
    {" "}
    <h2 className={H2_CLASSNAME}>
      <Trans>Need additional support?</Trans>
    </h2>
    <p>
      <Trans>
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
      </Trans>
    </p>
    <p>
      <Trans>Hours of operation: Monday to Friday, 9am - 5pm.</Trans>{" "}
      <Trans>Available in English and Spanish.</Trans>
    </p>
  </>
);

const getSocialShareContent = () => {
  const date = getEvictionMoratoriumEndDate();
  const url = getGlobalAppServerInfo().originURL;
  return {
    tweet: t(
      "evictionfree.tweetTemplateForSharingFromConfirmation2"
    )`I just used this website to send a hardship declaration form to my landlord and local courts—putting any eviction case on hold until ${date}. Check it out here: ${url} #EvictionFreeNY via @JustFixNYC @RTCNYC @housing4allNY`,
    emailSubject: t`Protect yourself from eviction in New York State`,
    emailBody: t(
      "evictionfree.emailBodyTemplateForSharingFromConfirmation2"
    )`On December 28, 2020, New York State passed legislation that protects tenants from eviction due to lost income or COVID-19 health risks. In order to get protected, you must fill out a hardship declaration form and send it to your landlord and/or the courts. I just used this website to send a hardship declaration form to my landlord and local courts—putting any eviction case on hold until ${date}. Check it out here: ${url}`,
  };
};

const ShareThisTool = () => (
  <>
    <h2 className={H2_CLASSNAME}>
      <Trans>Share this tool</Trans>
    </h2>
    <SocialIcons
      color="mulberry"
      customStyleClasses="is-marginless"
      socialShareContent={getSocialShareContent()}
    />
  </>
);

const ErapBlurb = () => (
  <>
    <h2 className={H2_CLASSNAME}>
      <Trans>Can't pay rent?</Trans>
    </h2>
    <p>
      <Trans id="evictionfree.erapBlurbOnConfirmation">
        You are not alone. Over a million New Yorkers cannot pay rent. New York
        State now has a rental relief program, the Emergency Rental Assistance
        Program (ERAP). If you apply for ERAP,{" "}
        <b>your landlord cannot start a new eviction case</b> against you and
        any current eviction case will be paused.
      </Trans>
    </p>
    <br />
    <p className="has-text-centered">
      <OutboundLink
        className="button is-primary is-large jf-is-extra-wide"
        href={ERAP_APPLICATION_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Trans>Apply for ERAP Online</Trans> →
      </OutboundLink>
    </p>
    <br />
    <p>
      <Trans>Other important resources:</Trans>
    </p>
    <ul>
      <li>
        <EnglishOutboundLink href={ERAP_LIST_OF_ASSISTING_GROUPS}>
          <Trans>List of groups who can help you apply for ERAP</Trans>
        </EnglishOutboundLink>
      </li>
      <li>
        <Trans>Rental Assistance Application Hotline:</Trans>
        <br />{" "}
        <OutboundLink href={RENTAL_ASSISTANCE_HOTLINE_PHONE_LINK}>
          1-844-NY1-RENT (1-844-691-7368)
        </OutboundLink>
      </li>
    </ul>
    <p>
      <Trans>
        Learn more on <RightToCounselFaqsLink />.
      </Trans>
    </p>
  </>
);

const OrganizingGroupsBlurb = () => (
  <>
    {" "}
    <h2 className={H2_CLASSNAME}>
      <Trans>Join the tenant movement</Trans>
    </h2>
    <p>
      <Trans id="evictionfree.getInvolvedWithCBO2">
        Get involved in your local community organization! Join thousands in the
        fight for an Eviction Free NY!
      </Trans>
    </p>
    <p className="has-text-centered">
      <OutboundLink
        className="button is-primary is-large jf-is-extra-wide"
        href={LIST_OF_ORGANIZING_GROUPS_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Trans>View list of organizations</Trans> →
      </OutboundLink>
    </p>
    <p className="is-size-6">
      <br />*
      <Trans>
        Due to the COVID-19 pandemic, some offices are closed and may not answer
        phones.
      </Trans>
    </p>
  </>
);

type LandlordMailType = "usps" | "email" | "both";

const deliveryMethodToLandlord: {
  [k in LandlordMailType]: MessageDescriptor;
} = {
  email: t`email`,
  usps: t`USPS Certified Mail`,
  both: t`email and USPS Certified Mail`,
};

function getDeclInfo(session: AllSessionInfo) {
  const shd = session.submittedHardshipDeclaration;

  if (!shd) return null;

  const landlordMailType: LandlordMailType =
    shd.mailedAt && shd.emailedAt ? "both" : shd.mailedAt ? "usps" : "email";

  return {
    pdfLink: getGlobalAppServerInfo().submittedHardshipDeclarationURL,
    mailedAt: shd.mailedAt ? friendlyUTCDate(shd.mailedAt) : "",
    landlordMailLabel: li18n._(deliveryMethodToLandlord[landlordMailType]),
    wasEmailedToHousingCourt: !!shd.emailedToHousingCourtAt,
    wasEmailedToUser: !!shd.emailedToUserAt,
    trackingNumber: shd.trackingNumber,
    trackingURL: `${USPS_TRACKING_URL_PREFIX}${shd.trackingNumber}`,
    isUserInNyc: !!session.onboardingInfo?.borough,
  };
}

export const EvictionFreeDbConfirmation = EvictionFreeRequireLoginStep(
  (props) => {
    const { session } = useContext(AppContext);
    const info = getDeclInfo(session);

    if (!info) {
      return <Redirect to={assertNotNull(props.prevStep)} />;
    }

    return (
      <Page
        title={li18n._(t`You've sent your hardship declaration`)}
        className="content"
        withHeading={renderTitleWithCheckCircle}
      >
        <p>
          <Trans>
            Your hardship declaration form has been sent to your landlord via{" "}
            {info.landlordMailLabel}.
          </Trans>{" "}
          {info.wasEmailedToHousingCourt ? (
            <Trans>
              A copy of the declaration has also been sent to your local court
              via email in order to ensure they have it on record if your
              landlord attempts to initiate an eviction case.
            </Trans>
          ) : (
            <Trans id="evictionfree.confirmationNoEmailToCourtYet">
              A copy of the declaration will also be sent to your local court
              via email—we are determining the appropriate court to receive your
              declaration. We will notify you via text and on this page when it
              is sent.
            </Trans>
          )}
        </p>
        {info.wasEmailedToUser && (
          <p>
            <Trans>
              Check your email for a message containing a copy of your
              declaration and additional important information on next steps.
            </Trans>
          </p>
        )}
        {info.mailedAt && (
          <>
            <h2 className={H2_CLASSNAME}>
              <Trans>Details about your declaration</Trans>
            </h2>
            <p>
              <Trans>Your letter was sent on {info.mailedAt}.</Trans>
            </p>
            <p>
              <span className="is-size-5 has-text-weight-bold">
                <Trans>USPS Tracking #:</Trans>
              </span>{" "}
              <OutboundLink
                href={info.trackingURL}
                target="_blank"
                rel="noopener noreferrer"
                className="is-size-5 is-size-6-mobile"
              >
                {info.trackingNumber}
              </OutboundLink>
            </p>
          </>
        )}
        <br />
        <PdfLink
          href={info.pdfLink}
          label={li18n._(t`Download completed declaration`)}
        />
        <ErapBlurb />
        <OrganizingGroupsBlurb />
        {info.isUserInNyc && (
          <>
            <RetaliationBlurb />
            <HcaHotlineBlurb />
          </>
        )}
        <ShareThisTool />
      </Page>
    );
  }
);
