import React from 'react';

import Page from "../page";
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { RadiosFormField } from '../form-fields';

import { withAppContext } from '../app-context';
import { NextButton, BackButton } from "../buttons";
import Routes from '../routes';
import { LetterRequestInput, LetterRequestMailChoice } from '../queries/globalTypes';
import { LetterRequestMutation } from '../queries/LetterRequestMutation';
import { DjangoChoices } from '../common-data';
import { AllSessionInfo } from '../queries/AllSessionInfo';

const LOC_MAILING_CHOICES = require('../../../common-data/loc-mailing-choices.json') as DjangoChoices;


function renderForm(ctx: FormContext<LetterRequestInput>): JSX.Element {
  return (
    <React.Fragment>
      <RadiosFormField
        label="Would you like JustFix.nyc to mail this letter to your landlord via Certified Mail on your behalf? We will cover the Certified mailing costs for you!"
        choices={LOC_MAILING_CHOICES}
        {...ctx.fieldPropsFor('mailChoice') }
      />
      <div className="field is-grouped">
        <BackButton to={Routes.loc.yourLandlord} />
        <NextButton isLoading={ctx.isLoading} label="Finish" />
      </div>
    </React.Fragment>
  );
}

function getInitialState(session: AllSessionInfo): LetterRequestInput {
  if (session.letterRequest) {
    const { mailChoice } = session.letterRequest;
    return { mailChoice };
  }
  return { mailChoice: LetterRequestMailChoice.WE_WILL_MAIL };
}

const LetterPreview = withAppContext((props) => (
  <div className="box has-text-centered jf-loc-preview">
    <iframe title="Preview of your letter of complaint" src={props.server.locHtmlURL}></iframe>
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
      <SessionUpdatingFormSubmitter
        mutation={LetterRequestMutation}
        initialState={getInitialState}
        onSuccessRedirect={Routes.loc.confirmation}
      >
        {renderForm}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
}
