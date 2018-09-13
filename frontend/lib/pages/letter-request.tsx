import React from 'react';

import Page from "../page";
import { LegacyFormSubmitter, FormContext } from '../forms';
import { RadiosFormField } from '../form-fields';

import { AppContextType, withAppContext } from '../app-context';
import { NextButton, BackButton } from "../buttons";
import Routes from '../routes';
import { assertNotNull } from '../util';
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

function LetterRequestPageWithAppContext(props: AppContextType): JSX.Element {
  return (
    <Page title="Review the Letter of Complaint">
      <h1 className="title">Review the Letter of Complaint</h1>
      <div className="content">
        <p>Here is a preview of the letter for you to review. It includes the repair issues you selected from the Issue Checklist.</p>
        <div className="box has-text-centered">
          Hey, we haven't implemented this yet.
        </div>
      </div>
      <LegacyFormSubmitter
        mutation={LetterRequestMutation}
        initialState={getInitialState(props.session)}
        onSuccess={(output) => {
          props.updateSession(assertNotNull(output.session));
        }}
        onSuccessRedirect={Routes.loc.confirmation}
      >
        {renderForm}
      </LegacyFormSubmitter>
    </Page>
  );
}

const LetterRequestPage = withAppContext(LetterRequestPageWithAppContext);

export default LetterRequestPage;
