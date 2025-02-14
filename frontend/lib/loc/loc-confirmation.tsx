import React from "react";

import { withAppContext, AppContextType } from "../app-context";
import { LetterRequestMailChoice } from "../queries/globalTypes";
import { AllSessionInfo_letterRequest } from "../queries/AllSessionInfo";
import Page from "../ui/page";
import { friendlyDate } from "../util/date-util";
import { OutboundLink } from "../ui/outbound-link";
import { PdfLink } from "../ui/pdf-link";
import { EmailAttachmentForm } from "../forms/email-attachment";
import { EmailLetterMutation } from "../queries/EmailLetterMutation";
import { BigList } from "../ui/big-list";
import { USPS_TRACKING_URL_PREFIX } from "../../../common-data/loc";
import { renderSuccessHeading } from "../ui/success-heading";
import { isUserNycha } from "../util/nycha";

const DownloadLetterLink = (props: { locPdfURL: string }) => (
  <PdfLink href={props.locPdfURL} label="Download letter" />
);

const getCommonMailNextSteps = (isUserNycha: boolean) => [
  <li>
    <p>
      Once received, {isUserNycha ? "management" : "your landlord"} should
      contact you to schedule time to make repairs for the access dates you
      provided.
    </p>
  </li>,
  <li>
    {isUserNycha ? (
      <p>
        If you have mold, moisture, or leaks, contact the independent
        court-ordered <strong>Ombudsperson’s Call Center (OCC)</strong> at{" "}
        <OutboundLink href={"tel:+18883417152"}>1-888-341-7152</OutboundLink> or{" "}
        <OutboundLink href={"https://ombnyc.com/"} target="_blank">
          ombnyc.com
        </OutboundLink>
        . They will advocate on your behalf to management to get your
        moisture-related repairs completed.
      </p>
    ) : (
      <p>
        While you wait, you should{" "}
        <strong>document your issues with photos</strong> and{" "}
        <strong>call 311 to request an HPD inspection.</strong>
      </p>
    )}
  </li>,
];

const getCommonWeMailNextSteps = (isUserNycha: boolean) => [
  ...getCommonMailNextSteps(isUserNycha),
  <li>
    We will continue to follow up with you via text message. If{" "}
    {isUserNycha ? "management" : "your landlord"} does not follow through, you
    now have better legal standing to sue{" "}
    {isUserNycha ? "management" : "your landlord"}.{" "}
    <strong>This is called an HP Action proceeding.</strong>
  </li>,
];

function WeMailedLetterStatus(props: {
  letterRequest: AllSessionInfo_letterRequest;
  locPdfURL: string;
  isUserNycha: boolean;
}): JSX.Element {
  const { letterSentAt, trackingNumber } = props.letterRequest;
  const url = `${USPS_TRACKING_URL_PREFIX}${trackingNumber}`;

  return (
    <>
      <p>
        We sent your letter of complaint
        {letterSentAt && (
          <>
            {" "}
            on <strong>{friendlyDate(new Date(letterSentAt))}</strong>
          </>
        )}
        !
      </p>
      <p>
        Your{" "}
        <b>
          USPS Certified Mail<sup>&reg;</sup>
        </b>{" "}
        tracking number is <a href={url}>{trackingNumber}</a>.
      </p>
      <DownloadLetterLink {...props} />
      <h2>What happens next?</h2>
      <BigList children={[...getCommonWeMailNextSteps(props.isUserNycha)]} />
    </>
  );
}

function WeWillMailLetterStatus(props: {
  letterRequest: AllSessionInfo_letterRequest;
  locPdfURL: string;
  isUserNycha: boolean;
}): JSX.Element {
  const dateStr = friendlyDate(new Date(props.letterRequest.updatedAt));
  return (
    <>
      <p>
        We've received your request to mail a letter of complaint on{" "}
        <strong>{dateStr}</strong>. We'll text you a link to your{" "}
        <b>
          USPS Certified Mail<sup>&reg;</sup>
        </b>{" "}
        tracking number once we have it.
      </p>
      <DownloadLetterLink {...props} />
      <h2>What happens next?</h2>
      <BigList
        children={[
          <li>
            <p>
              We’ll mail your letter via{" "}
              <b>
                USPS Certified Mail<sup>&reg;</sup>
              </b>{" "}
              and provide a tracking number via text message.
            </p>
          </li>,
          ...getCommonWeMailNextSteps(props.isUserNycha),
        ]}
      />
    </>
  );
}

function UserWillMailLetterStatus(props: {
  locPdfURL: string;
  isUserNycha: boolean;
}): JSX.Element {
  return (
    <>
      <p>Here is a link to a PDF of your saved letter:</p>
      <DownloadLetterLink {...props} />
      <h2>What happens next?</h2>
      <BigList
        children={[
          <li>
            <p>
              Print out your letter and{" "}
              <strong>mail it via Certified Mail</strong> - this allows you to
              prove that it was sent to{" "}
              {props.isUserNycha ? "management" : "your landlord"}.
            </p>
          </li>,
          ...getCommonMailNextSteps(props.isUserNycha),
        ]}
      />
    </>
  );
}

const knowYourRightsList = (
  <ul>
    <li>
      <OutboundLink href="https://www.metcouncilonhousing.org/help-answers/getting-repairs/">
        Met Council on Housing
      </OutboundLink>{" "}
      (
      <OutboundLink href="https://www.metcouncilonhousing.org/help-answers/how-to-get-repairs-spanish/">
        en español
      </OutboundLink>
      )
    </li>
    <li>
      <OutboundLink href="http://housingcourtanswers.org/glossary/">
        Housing Court Answers
      </OutboundLink>
    </li>
    <li>
      <OutboundLink href="https://www.justfix.org/en/learn?utm_source=tenantplatform&utm_medium=loc">
        JustFix's Learning Center
      </OutboundLink>{" "}
      (
      <OutboundLink href="https://www.justfix.org/es/learn?utm_source=tenantplatform&utm_medium=loc">
        en español
      </OutboundLink>
      )
    </li>
  </ul>
);

const LetterConfirmation = withAppContext(
  (props: AppContextType): JSX.Element => {
    const { letterRequest } = props.session;
    const letterStatusProps = {
      locPdfURL: props.server.finishedLocPdfURL,
      isUserNycha: isUserNycha(props.session),
    };
    let letterConfirmationPageTitle, letterStatus;

    if (letterRequest && letterRequest.trackingNumber) {
      letterConfirmationPageTitle = "Your Letter of Complaint has been sent!";
      letterStatus = (
        <WeMailedLetterStatus
          letterRequest={letterRequest}
          {...letterStatusProps}
        />
      );
    } else if (
      letterRequest &&
      letterRequest.mailChoice === LetterRequestMailChoice.WE_WILL_MAIL
    ) {
      letterConfirmationPageTitle = "Your Letter of Complaint is being sent!";
      letterStatus = (
        <WeWillMailLetterStatus
          letterRequest={letterRequest}
          {...letterStatusProps}
        />
      );
    } else {
      letterConfirmationPageTitle =
        "Your Letter of Complaint has been created!";
      letterStatus = <UserWillMailLetterStatus {...letterStatusProps} />;
    }

    return (
      <Page
        title={letterConfirmationPageTitle}
        withHeading={renderSuccessHeading}
        className="content"
      >
        {letterStatus}
        <h2>
          Email a copy of your letter to yourself, someone you trust, or{" "}
          {isUserNycha(props.session) ? "management" : "your landlord"}.
        </h2>
        <EmailAttachmentForm mutation={EmailLetterMutation} noun="letter" />
        <h2>Want to read more about your rights?</h2>
        {knowYourRightsList}
      </Page>
    );
  }
);

export default LetterConfirmation;
