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
      <TextualFormField label="Landlord's name (optional)" type="text" {...ctx.fieldPropsFor('name')} />
      <TextareaFormField label="Landlord's address (optional)" {...ctx.fieldPropsFor('address')} />
      <div className="buttons">
        <BackButton to={Routes.loc.accessDates} />
        <NextButton isLoading={ctx.isLoading} label="Preview letter" />
      </div>
    </React.Fragment>
  );
}

function getIntroText(isLookedUp: boolean|null): JSX.Element {
  return isLookedUp
    ? (
      <React.Fragment>
        <p>Below is your landlord’s information as registered with the NYC Department of Housing Preservation and Development.</p>
        <p>This may be different than where you send your rent checks. If you think this information is wrong you can change it, and we can double check for you.</p>
      </React.Fragment>
    )
    : (
      <React.Fragment>
        <p>If you have your landlord's name and contact information, please enter it below.</p>
        <p>If you don't know, we'll look it up for you.</p>
      </React.Fragment>
    );
}

export default withAppContext(function LandlordDetailsPage(props: AppContextType): JSX.Element {
  const { landlordDetails } = props.session;

  return (
    <Page title="Your landlord">
      <h1 className="title">Your landlord</h1>
      <div className="content">
        {getIntroText(landlordDetails && landlordDetails.isLookedUp)}
      </div>
      <SessionUpdatingFormSubmitter
        mutation={LandlordDetailsMutation}
        initialState={(session) => exactSubsetOrDefault(session.landlordDetails, BLANK_INPUT)}
        onSuccessRedirect={Routes.loc.preview}
      >
        {renderForm}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
