import React from 'react';

import Page from "../page";
import { FormContext, SessionUpdatingFormSubmitter } from '../forms';
import { TextualFormField, TextareaFormField } from '../form-fields';

import { NextButton, BackButton } from "../buttons";
import Routes from '../routes';
import { LandlordDetailsInput } from '../queries/globalTypes';
import { LandlordDetailsMutation } from '../queries/LandlordDetailsMutation';
import { AppContextType, withAppContext } from '../app-context';
import { exactSubsetOrDefault } from '../util';


const BLANK_INPUT: LandlordDetailsInput = {
  name: '',
  address: ''
};

function renderForm(ctx: FormContext<LandlordDetailsInput>): JSX.Element {
  return (
    <React.Fragment>
      <TextualFormField label="Landlord's name" type="text" {...ctx.fieldPropsFor('name')} />
      <TextareaFormField label="Landlord's address" {...ctx.fieldPropsFor('address')} />
      <div className="buttons jf-two-buttons">
        <BackButton to={Routes.loc.accessDates} label="Back" />
        <NextButton isLoading={ctx.isLoading} label="Preview letter" />
      </div>
    </React.Fragment>
  );
}

function getIntroText(isLookedUp: boolean|null): JSX.Element {
  return isLookedUp
    ? (
      <React.Fragment>
        <p className="subtitle is-6">This is your landlord’s information as registered with the <b>NYC Department of Housing and Preservation (HPD)</b>. This may be different than where you send your rent checks.</p>
        <p className="subtitle is-6">We recommend using this address to ensure your landlord receives it.</p>
      </React.Fragment>
    )
    : (
      <React.Fragment>
        <p className="subtitle is-6">If you have your landlord's name and contact information, please enter it below. You can find this information on your lease and/or rent receipts.</p>
      </React.Fragment>
    );
}

export default withAppContext(function LandlordDetailsPage(props: AppContextType): JSX.Element {
  const { landlordDetails } = props.session;

  return (
    <Page title="Landlord information">
      <div>
        <h1 className="title is-4 is-spaced">Landlord information</h1>
        {getIntroText(landlordDetails && landlordDetails.isLookedUp)}
        <SessionUpdatingFormSubmitter
          mutation={LandlordDetailsMutation}
          initialState={(session) => exactSubsetOrDefault(session.landlordDetails, BLANK_INPUT)}
          onSuccessRedirect={Routes.loc.preview}
        >
          {renderForm}
        </SessionUpdatingFormSubmitter>
      </div>
    </Page>
  );
});
