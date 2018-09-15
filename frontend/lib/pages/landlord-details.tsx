import React from 'react';

import Page from "../page";
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { TextualFormField, TextareaFormField } from '../form-fields';

import { NextButton, BackButton } from "../buttons";
import Routes from '../routes';
import { LandlordDetailsInput } from '../queries/globalTypes';
import { LandlordDetailsMutation } from '../queries/LandlordDetailsMutation';


const BLANK_INPUT: LandlordDetailsInput = {
  name: '',
  address: ''
};

function renderForm(ctx: FormContext<LandlordDetailsInput>): JSX.Element {
  return (
    <React.Fragment>
      <TextualFormField label="Landlord's name (optional)" type="text" {...ctx.fieldPropsFor('name')} />
      <TextareaFormField label="Landlord's address (optional)" {...ctx.fieldPropsFor('address')} />
      <div className="field is-grouped">
        <BackButton to={Routes.loc.accessDates} />
        <NextButton isLoading={ctx.isLoading} label="Preview letter" />
      </div>
    </React.Fragment>
  );
}

export default function LandlordDetailsPage(): JSX.Element {
  return (
    <Page title="Your landlord">
      <h1 className="title">Your landlord</h1>
      <div className="content">
        <p>If you have your landlord's name and contact information, please enter it below.</p>
        <p>If you don't know, we'll look it up for you.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={LandlordDetailsMutation}
        initialState={(session) => session.landlordDetails || BLANK_INPUT}
        onSuccessRedirect={Routes.loc.preview}
      >
        {renderForm}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
}
