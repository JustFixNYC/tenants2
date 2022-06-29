import React, { useState } from "react";

import { withAppContext, AppContextType, AppContext } from "../app-context";
import { LetterRequestMailChoice } from "../queries/globalTypes";
import { AllSessionInfo_letterRequest } from "../queries/AllSessionInfo";
import Page from "../ui/page";
import classnames from "classnames";
import { friendlyDate } from "../util/date-util";
import { OutboundLink } from "../ui/outbound-link";
import { PdfLink } from "../ui/pdf-link";
import { EmailAttachmentForm } from "../forms/email-attachment";
import { EmailLetterMutation } from "../queries/EmailLetterMutation";
import { BigList } from "../ui/big-list";
import { USPS_TRACKING_URL_PREFIX } from "../../../common-data/loc";
import { SquareImage } from "../data-driven-onboarding/data-driven-onboarding";
import { ariaBool } from "../ui/aria";
import { renderSuccessHeading } from "../ui/success-heading";

const SanitationGuidelines = () => {
  const [isExpanded, toggleExpansion] = useState(false);

  return (
    <AppContext.Consumer>
      {(ctx) => {
        const inSafeMode = ctx.session.isSafeModeEnabled;
        return (
          <div className="jf-sanitation-guidelines notification is-warning">
            <div>
              Please be aware that letting a repair-worker into your home to
              make repairs may increase exposure to the COVID-19 virus. In order
              to follow social distancing guidelines and to limit exposure,
              please follow these steps to stay as safe as possible.
              {!inSafeMode && (
                <>
                  {" "}
                  <button
                    className={classnames(
                      "button",
                      "is-text",
                      "is-paddingless",
                      "is-uppercase",
                      isExpanded && "is-hidden"
                    )}
                    role="button"
                    onClick={() => toggleExpansion(true)}
                    aria-label="Show me sanitation guidelines"
                    aria-expanded={ariaBool(isExpanded)}
                  >
                    Show more
                  </button>
                </>
              )}
            </div>
            <div
              className={classnames(
                "content",
                !isExpanded && !inSafeMode && "is-hidden"
              )}
            >
              <div className="columns">
                <div className="column is-one-quarter">
                  <SquareImage
                    size={128}
                    src="frontend/img/sanitation-guide/chat.svg"
                    alt="chat-with-repair-worker"
                  />
                </div>
                <div className="column">
                  <h3 className="is-size-6 is-uppercase has-text-weight-bold has-text-grey-dark">
                    Before the repair-worker arrives
                  </h3>
                  <p>
                    Talk to anyone that you live with and let them know that a
                    repair-worker is coming to perform the repairs that you
                    requested.
                  </p>
                </div>
              </div>
              <div className="columns">
                <div className="column is-one-quarter">
                  <SquareImage
                    size={128}
                    src="frontend/img/sanitation-guide/hands.svg"
                    alt="wash-hands"
                  />
                </div>
                <div className="column">
                  <h3 className="is-size-6 is-uppercase has-text-weight-bold has-text-grey-dark">
                    While the repair-worker is inside your home
                  </h3>
                  <p>
                    Have the repair-worker wash their hands with soap for at
                    least 20 seconds as soon as they come into your house.
                  </p>
                  <p>
                    If possible, stay in a different room from where the work is
                    being done. If a separate room is not available, maintain at
                    least a six-foot distance from the repair-worker until the
                    repair is completed.
                  </p>
                </div>
              </div>
              <div className="columns">
                <div className="column is-one-quarter">
                  <SquareImage
                    size={128}
                    src="frontend/img/sanitation-guide/wipe.svg"
                    alt="wipe-down-surfaces"
                  />
                </div>
                <div className="column">
                  <h3 className="is-size-6 is-uppercase has-text-weight-bold has-text-grey-dark">
                    After the repair-worker leaves
                  </h3>
                  <p>
                    Immediately sanitize all surfaces in your home, especially
                    doorknobs, the sink where the repair-worker washed their
                    hands, and any surfaces you know they have likely been in
                    contact with.
                  </p>
                  <p className="is-size-7">
                    For guidance on how to thoroughly sanitize your home and a
                    list of recommended effective cleaning products visit{" "}
                    <OutboundLink href="https://www.cdc.gov/coronavirus/2019-ncov/prepare/cleaning-disinfection.html">
                      Center for Disease Control (CDC) Guide on How to Clean and
                      Disinfect
                    </OutboundLink>
                    .
                  </p>
                </div>
              </div>
              {!inSafeMode && (
                <div className="hero is-small is-warning">
                  <div className="hero-body has-text-centered">
                    <button
                      className={classnames(
                        "button",
                        "is-text",
                        "is-paddingless",
                        "is-uppercase"
                      )}
                      role="button"
                      onClick={() => toggleExpansion(false)}
                      aria-label="Hide sanitation guidelines"
                      aria-expanded={ariaBool(isExpanded)}
                    >
                      Show less
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </AppContext.Consumer>
  );
};

const DownloadLetterLink = (props: { locPdfURL: string }) => (
  <PdfLink href={props.locPdfURL} label="Download letter" />
);

const getCommonMailNextSteps = () => [
  <li>
    <p>
      Once received, your landlord should contact you to schedule time to make
      repairs for the access dates you provided.
    </p>
    <SanitationGuidelines />
  </li>,
  <li>
    While you wait, you should <strong>document your issues with photos</strong>{" "}
    and <strong>call 311 to request an HPD inspection.</strong>
  </li>,
];

const getCommonWeMailNextSteps = () => [
  ...getCommonMailNextSteps(),
  <li>
    We will continue to follow up with you via text message. If your landlord
    does not follow through, you now have better legal standing to sue your
    landlord. <strong>This is called an HP Action proceeding.</strong>
  </li>,
];

function WeMailedLetterStatus(props: {
  letterRequest: AllSessionInfo_letterRequest;
  locPdfURL: string;
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
      <BigList children={[...getCommonWeMailNextSteps()]} />
    </>
  );
}

function WeWillMailLetterStatus(props: {
  letterRequest: AllSessionInfo_letterRequest;
  locPdfURL: string;
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
          ...getCommonWeMailNextSteps(),
        ]}
      />
    </>
  );
}

function UserWillMailLetterStatus(props: { locPdfURL: string }): JSX.Element {
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
              prove that it was sent to your landlord.
            </p>
          </li>,
          ...getCommonMailNextSteps(),
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
    const letterStatusProps = { locPdfURL: props.server.finishedLocPdfURL };
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
        {/* Temporarily remove confetti during COVID-19 crisis :( */}
        {/* <ProgressiveLoadableConfetti regenerateForSecs={1} /> */}
        {letterStatus}
        <h2>
          Email a copy of your letter to yourself, someone you trust, or your
          landlord.
        </h2>
        <EmailAttachmentForm mutation={EmailLetterMutation} noun="letter" />
        <h2>Want to read more about your rights?</h2>
        {knowYourRightsList}
      </Page>
    );
  }
);

export default LetterConfirmation;
