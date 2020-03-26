import React, { useState } from 'react';

import { withAppContext, AppContextType } from '../app-context';
import { LetterRequestMailChoice } from '../queries/globalTypes';
import { AllSessionInfo_letterRequest } from '../queries/AllSessionInfo';
import Page from '../page';
import classnames from 'classnames';
import { friendlyDate } from '../util';
import { OutboundLink } from '../google-analytics';
import { PdfLink } from '../pdf-link';
import { ProgressiveLoadableConfetti } from '../confetti-loadable';
import { EmailAttachmentForm } from '../email-attachment';
import { EmailLetterMutation } from '../queries/EmailLetterMutation';
import { BigList } from '../big-list';
import { USPS_TRACKING_URL_PREFIX } from "../../../common-data/loc.json";
import { SquareImage } from './data-driven-onboarding';

const LetterViaEmailInstructions = `If you want to send your Letter of Complaint to your landlord and/or management company via email, download the PDF and include it as an attachment to your regular email.`

const SanitationGuidelines = () => {

  const [isExpanded, toggleExpansion] = useState(false);

  return (
    <div className="jf-sanitation-guidelines notification is-warning">
      <div>
        Please be aware that letting a repair-worker into your home to make repairs may expose you to the Covid-19 virus. 
        In order to follow social distancing guidelines and to limit your exposure, please follow these steps to stay as safe as possible.
        {' '}<button className={classnames("button","is-text","is-paddingless","is-uppercase", isExpanded && "is-hidden")} 
              onClick={() => toggleExpansion(true)}>
          Learn More
        </button>
      </div>
      <div className={classnames("content", !isExpanded && "is-hidden")}>
        <div className="columns">
          <div className="column is-one-quarter">
            <SquareImage size={128} src='frontend/img/96x96.png' alt="" />
          </div>
          <div className="column">
            <h6 className="is-uppercase has-text-weight-bold">Before the repair-worker arrives</h6>
            <p>Talk to anyone that you live with and let them know that a repair-worker is coming to perform the repairs that you requested.</p>
          </div>
        </div>
        <div className="columns">
          <div className="column is-one-quarter">
            <SquareImage size={128} src='frontend/img/96x96.png' alt="" />
          </div>
          <div className="column">
            <h6 className="is-uppercase has-text-weight-bold">While the repair-worker is inside your home</h6>
            <p>Have the repair-worker wash their hands with soap for at least 20 seconds as soon as they come into your house.</p>
            <p>If possible, stay in a different room from where the work is being done. If a separate room is not available, maintain at least a six-foot distance from the repair-worker until the repair is completed.</p>
          </div>
        </div>
        <div className="columns">
          <div className="column is-one-quarter">
            <SquareImage size={128} src='frontend/img/96x96.png' alt="" />
          </div>
          <div className="column">
            <h6 className="is-uppercase has-text-weight-bold">After the repair-worker leaves</h6>
            <p>Immediately sanitize all surfaces in your home, especially doorknobs, the sink where the repair-worker washed their hands, and any surfaces you know they have likely been in contact with.</p>
            <p className="is-size-7">For guidance on how to thoroughly sanitize your home and a list of recommended effective cleaning products visit 
              {' '}<OutboundLink href="https://www.cdc.gov/coronavirus/2019-ncov/prepare/cleaning-disinfection.html" target="_blank">Center for Disease Control (CDC) Guide on How to Clean and Disinfect</OutboundLink>
            </p>
          </div>
        </div>
        <div className="hero is-small is-warning">
          <div className="hero-body has-text-centered">
            <button className={classnames("button","is-text","is-paddingless","is-uppercase")} 
              onClick={() => toggleExpansion(false)}>
                Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const DownloadLetterLink = (props: { locPdfURL: string }) => (
  <PdfLink href={props.locPdfURL} label="Download letter" />
);

const getCommonMailNextSteps = () => [
  <li>
    <p>
      Once received, your landlord should contact you to schedule time to make repairs for the access dates you provided.
    </p>
    <SanitationGuidelines />
  </li>,
  <li>While you wait, you should <strong>document your issues with photos</strong> and <strong>call 311 to request an HPD inspection.</strong></li>
];

const getCommonWeMailNextSteps = () => [
  ...getCommonMailNextSteps(),
  <li>We will continue to follow up with you via text message. If your landlord does not follow through, you now have better legal standing to sue your landlord. <strong>This is called an HP Action proceeding.</strong></li>
];

function WeMailedLetterStatus(props: {
  letterRequest: AllSessionInfo_letterRequest,
  locPdfURL: string
}): JSX.Element {
  const {letterSentAt, trackingNumber} = props.letterRequest;
  const url = `${USPS_TRACKING_URL_PREFIX}${trackingNumber}`;

  return (
    <>
      <p>We sent your letter of complaint{letterSentAt && <> on <strong>{friendlyDate(new Date(letterSentAt))}</strong></>}!</p>
      <p>Your <b>USPS Certified Mail<sup>&reg;</sup></b> tracking number is <a href={url} target="_blank" rel="noopener, noreferrer">{trackingNumber}</a>.</p>
      <DownloadLetterLink {...props} />
      <h2>What happens next?</h2>
      <BigList children={[
        <li>
          <p>{LetterViaEmailInstructions}</p>
        </li>,
        ...getCommonWeMailNextSteps()
      ]} />
    </>
  );
}

function WeWillMailLetterStatus(props: {
  letterRequest: AllSessionInfo_letterRequest,
  locPdfURL: string
}): JSX.Element {
  const dateStr = friendlyDate(new Date(props.letterRequest.updatedAt));

  return (
    <>
      <p>We've received your request to mail a letter of complaint on <strong>{dateStr}</strong>. We'll text you a link to your <b>USPS Certified Mail<sup>&reg;</sup></b> tracking number once we have it!</p>
      <DownloadLetterLink {...props} />
      <h2>What happens next?</h2>
      <BigList children={[
        <li>
          <p>We’ll mail your letter via <b>USPS Certified Mail<sup>&reg;</sup></b> and provide a tracking number via text message.</p>
          <p>{LetterViaEmailInstructions}</p>
        </li>,
        ...getCommonWeMailNextSteps(),
      ]}/>
    </>
  );
}

function UserWillMailLetterStatus(props: { locPdfURL: string }): JSX.Element {
  return (
    <>
      <p>Here is a link to a PDF of your saved letter:</p>
      <DownloadLetterLink {...props} />
      <h2>What happens next?</h2>
      <BigList children={[
        <li>
          <p>Print out your letter and <strong>mail it via Certified Mail</strong> - this allows you to prove that it was sent to your landlord.</p>
          <p>{LetterViaEmailInstructions}</p>
        </li>,
        ...getCommonMailNextSteps(),
      ]}/>
    </>
  );
}

const knowYourRightsList = (
  <ul>
    <li><OutboundLink href="https://www.metcouncilonhousing.org/help-answers/getting-repairs/" target="_blank">Met Council on Housing</OutboundLink>
      {' '}(<OutboundLink href="https://www.metcouncilonhousing.org/help-answers/how-to-get-repairs-spanish/" target="_blank">en español</OutboundLink>)</li>
    <li><OutboundLink href="http://housingcourtanswers.org/glossary/" target="_blank">Housing Court Answers</OutboundLink></li>
    <li><OutboundLink href="https://www.justfix.nyc/learn?utm_source=tenantplatform&utm_medium=loc" target="_blank">JustFix.nyc's Learning Center</OutboundLink></li>
  </ul>
);

const LetterConfirmation = withAppContext((props: AppContextType): JSX.Element => {
  const { letterRequest } = props.session;
  const letterStatusProps = { locPdfURL: props.server.locPdfURL };
  let letterConfirmationPageTitle, letterStatus;

  if (letterRequest && letterRequest.trackingNumber) {
    letterConfirmationPageTitle = 'Your Letter of Complaint has been sent!';
    letterStatus = <WeMailedLetterStatus letterRequest={letterRequest} {...letterStatusProps} />;
  } else if (letterRequest && letterRequest.mailChoice === LetterRequestMailChoice.WE_WILL_MAIL) {
    letterConfirmationPageTitle = 'Your Letter of Complaint is being sent!';
    letterStatus = <WeWillMailLetterStatus letterRequest={letterRequest} {...letterStatusProps} />;
  } else {
    letterConfirmationPageTitle = 'Your Letter of Complaint has been created!';
    letterStatus = <UserWillMailLetterStatus {...letterStatusProps} />;
  }

  return (
    <Page title={letterConfirmationPageTitle} withHeading="big" >
      <ProgressiveLoadableConfetti regenerateForSecs={1} />
      <div className="content">
        {letterStatus}
        <h2>Email a copy of your letter to yourself, someone you trust, or your landlord.</h2>
        <EmailAttachmentForm mutation={EmailLetterMutation} noun="letter" />
        <h2>Want to read more about your rights?</h2>
        {knowYourRightsList}
      </div>
    </Page>
  );
});

export default LetterConfirmation;
