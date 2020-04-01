import React, { useContext } from 'react';
import { AllSessionInfo_landlordDetails } from '../queries/AllSessionInfo';
import { AppContext } from '../app-context';
import { MiddleProgressStep, MiddleProgressStepProps } from '../progress-step-route';
import Page from '../page';
import { SessionUpdatingFormSubmitter } from '../session-updating-form-submitter';
import { LandlordDetailsV2Mutation, BlankLandlordDetailsV2Input } from '../queries/LandlordDetailsV2Mutation';
import { exactSubsetOrDefault } from '../util';
import { TextualFormField, SelectFormField } from '../form-fields';
import { ProgressButtons, BackButton } from '../buttons';
import { Link } from 'react-router-dom';
import { getQuerystringVar } from '../querystring';
import US_STATE_CHOICES from '../../../common-data/us-state-choices.json';
import { DjangoChoices } from '../common-data';

const ReadOnlyLandlordDetails: React.FC<MiddleProgressStepProps & {
  details: AllSessionInfo_landlordDetails
}> = props => (
  <>
    <p>This is your landlord’s information as registered with the <b>NYC Department of Housing and Preservation (HPD)</b>. This may be different than where you send your rent checks.</p>
    <dl>
      <dt>Name</dt>
      <dd>{props.details.name}</dd>
      <dt>Address</dt>
      <dd>{props.details.address}</dd>
    </dl>
    <p>We'll use these details to automatically fill out your HP Action forms!</p>
    <ProgressButtons>
      <BackButton to={props.prevStep} />
      <Link to={props.nextStep} className="button is-primary is-medium" >Next</Link>
    </ProgressButtons>
  </>
);

const EditableLandlordDetails: React.FC<MiddleProgressStepProps> = props => {
  return <>
    <p>We were unable to retrieve information from the <b>NYC Department of Housing and Preservation (HPD)</b> about your landlord, so you will need to fill out the information yourself below.</p>
    <SessionUpdatingFormSubmitter
      mutation={LandlordDetailsV2Mutation}
      initialState={(session) => exactSubsetOrDefault(session.landlordDetails, BlankLandlordDetailsV2Input)}
      onSuccessRedirect={props.nextStep}
    >
      {ctx => <>
        <TextualFormField {...ctx.fieldPropsFor('name')} label="Landlord name" />
        <TextualFormField {...ctx.fieldPropsFor('primaryLine')} label="Street address" />
        <TextualFormField {...ctx.fieldPropsFor('city')} label="City" />
        <SelectFormField {...ctx.fieldPropsFor('state')} choices={US_STATE_CHOICES as DjangoChoices} label="State" />
        <TextualFormField {...ctx.fieldPropsFor('zipCode')} label="ZIp code" />
        <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
      </>}
    </SessionUpdatingFormSubmitter>
  </>;
};

export const HPActionYourLandlord = MiddleProgressStep(props => {
  const {session} = useContext(AppContext);
  const details = session.landlordDetails;
  const forceEdit = getQuerystringVar(props, 'edit') === 'on';

  return (
    <Page title="Your landlord" withHeading className="content">
      {!forceEdit && details && details.isLookedUp && details.name && details.address
        ? <ReadOnlyLandlordDetails {...props} details={details} />
        : <EditableLandlordDetails {...props} />}
    </Page>
  );
});
