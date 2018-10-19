import React from 'react';

import Page from "../page";
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';

import { withAppContext, AppContextType } from '../app-context';
import { NextButton, BackButton } from "../buttons";
import Routes from '../routes';
import { LetterRequestInput, LetterRequestMailChoice } from '../queries/globalTypes';
import { LetterRequestMutation } from '../queries/LetterRequestMutation';
import { Modal, BackOrUpOneDirLevel, ModalLink } from '../modal';
import { Link } from 'react-router-dom';

const WE_WILL_MAIL_INPUT: LetterRequestInput = {
  mailChoice: LetterRequestMailChoice.WE_WILL_MAIL
};

const UNKNOWN_LANDLORD = { name: '', address: '' };

export const SendConfirmModal = withAppContext((props: AppContextType): JSX.Element => {
  const title = "Ready to go!";
  const landlord = props.session.landlordDetails || UNKNOWN_LANDLORD;

  return (
    <Modal title={title} onCloseGoTo={BackOrUpOneDirLevel} render={(ctx) => (
      <div className="content box">
        <h1 className="title">{title}</h1>
        <p>
          JustFix.nyc will mail this certified letter within 2 business days to your landlord at:
        </p>
        <address>
          {landlord.name || 'UNKNOWN LANDLORD'}<br/>
          {landlord.address || 'UNKNOWN ADDRESS'}
        </address>
        <br/>
        <SessionUpdatingFormSubmitter
          mutation={LetterRequestMutation}
          initialState={WE_WILL_MAIL_INPUT}
          onSuccessRedirect={Routes.loc.confirmation}
        >
          {renderForm}
        </SessionUpdatingFormSubmitter>
      </div>
    )}/>
  );
});

function renderForm(ctx: FormContext<LetterRequestInput>): JSX.Element {
  return (
    <div className="has-text-centered">
      <NextButton isLoading={ctx.isLoading} label="Mail my letter!" />
    </div>
  );
}

const LetterPreview = withAppContext((props) => (
  <div className="box has-text-centered jf-loc-preview">
    <iframe scrolling="no" title="Preview of your letter of complaint" src={props.server.locHtmlURL}></iframe>
  </div>
));

export default function LetterRequestPage(): JSX.Element {
  return (
    <Page title="Review the Letter of Complaint">
      <h1 className="title">Review the Letter of Complaint</h1>
      <div className="content">
        <p>Here is a preview of the letter for you to review. It includes the repair issues you selected from the Issue Checklist.</p>
        <LetterPreview />
      </div>
      <div className="buttons jf-two-buttons">
        <BackButton to={Routes.loc.yourLandlord} label="Back" />
        <ModalLink to={Routes.loc.previewSendConfirmModal} component={SendConfirmModal} className="button is-primary">
          I'm ready to send!
        </ModalLink>
      </div>
      <div className="has-text-centered">
        <Link to={Routes.loc.confirmation} className="button is-light">I want to mail this myself.</Link>
      </div>
    </Page>
  );
}
