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
import { Link } from 'react-router-dom';


const BLANK_INPUT: LandlordDetailsInput = {
  name: '',
  address: ''
};

const PREV_STEP = Routes.loc.accessDates;

const NEXT_STEP = Routes.loc.preview;

function renderForm(ctx: FormContext<LandlordDetailsInput>): JSX.Element {
  return (
    <React.Fragment>
      <TextualFormField label="Landlord's name" type="text" {...ctx.fieldPropsFor('name')} />
      <TextareaFormField label="Landlord's address" {...ctx.fieldPropsFor('address')} />
      <div className="buttons jf-two-buttons">
        <BackButton to={PREV_STEP} label="Back" />
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
        <p className="subtitle is-6">We will use this address to ensure your landlord receives it.</p>
      </React.Fragment>
    )
    : (
      <React.Fragment>
        <p className="subtitle is-6">Please enter your landlord's name and contact information below. You can find this information on your lease and/or rent receipts.</p>
      </React.Fragment>
    );
}

function splitLines(text: string): JSX.Element[] {
  return text.split('\n').map((line, i) => <div key={i}>{line}</div>);
}

export default withAppContext(function LandlordDetailsPage(props: AppContextType): JSX.Element {
  const { landlordDetails } = props.session;

  return (
    <Page title="Landlord information">
      <div>
        <h1 className="title is-4 is-spaced">Landlord information</h1>
        {getIntroText(landlordDetails && landlordDetails.isLookedUp)}
        {landlordDetails && landlordDetails.isLookedUp
          ? <div className="content">
              <dl>
                <dt><strong>Landlord name</strong></dt>
                <dd>{landlordDetails.name}</dd>
                <br/>
                <dt><strong>Landlord address</strong></dt>
                <dd>{splitLines(landlordDetails.address)}</dd>
              </dl>
              <div className="buttons jf-two-buttons">
                <BackButton to={PREV_STEP} label="Back" />
                <Link to={NEXT_STEP} className="button is-primary is-medium">Preview letter</Link>
              </div>
            </div>
          : <SessionUpdatingFormSubmitter
              mutation={LandlordDetailsMutation}
              initialState={(session) => exactSubsetOrDefault(session.landlordDetails, BLANK_INPUT)}
              onSuccessRedirect={NEXT_STEP}
            >
              {renderForm}
            </SessionUpdatingFormSubmitter>
        }
      </div>
    </Page>
  );
});
