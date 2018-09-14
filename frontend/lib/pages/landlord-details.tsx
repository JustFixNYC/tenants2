import React from 'react';

import Page from "../page";
import { LegacyFormSubmitter, FormContext } from '../forms';
import { TextualFormField, TextareaFormField } from '../form-fields';

import { AppContextType, withAppContext } from '../app-context';
import { NextButton, BackButton } from "../buttons";
import Routes from '../routes';
import { assertNotNull } from '../util';
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

function LandlordDetailsPageWithAppContext(props: AppContextType): JSX.Element {
  return (
    <Page title="Your landlord">
      <h1 className="title">Your landlord</h1>
      <div className="content">
        <p>If you have your landlord's name and contact information, please enter it below.</p>
        <p>If you don't know, we'll look it up for you.</p>
      </div>
      <LegacyFormSubmitter
        mutation={LandlordDetailsMutation}
        initialState={props.session.landlordDetails || BLANK_INPUT}
        onSuccess={(output) => {
          props.updateSession(assertNotNull(output.session));
        }}
        onSuccessRedirect={Routes.loc.preview}
      >
        {renderForm}
      </LegacyFormSubmitter>
    </Page>
  );
}

const LandlordDetailsPage = withAppContext(LandlordDetailsPageWithAppContext);

export default LandlordDetailsPage;
