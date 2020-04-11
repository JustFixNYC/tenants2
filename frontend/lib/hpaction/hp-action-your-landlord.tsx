import React, { useContext } from 'react';
import { AppContext } from '../app-context';
import { MiddleProgressStep, MiddleProgressStepProps } from '../progress/progress-step-route';
import Page from '../ui/page';
import { SessionUpdatingFormSubmitter } from '../forms/session-updating-form-submitter';
import { LandlordDetailsV2Mutation, BlankLandlordDetailsV2Input } from '../queries/LandlordDetailsV2Mutation';
import { exactSubsetOrDefault } from '../util/util';
import { TextualFormField } from '../forms/form-fields';
import { ProgressButtons, BackButton } from '../ui/buttons';
import { Link } from 'react-router-dom';
import { USStateFormField } from '../forms/mailing-address-fields';
import { LEGACY_NYCHA_ADDRESS, isUserNycha, LegacyAddressDetails } from '../util/nycha';

const ReadOnlyLandlordDetails: React.FC<MiddleProgressStepProps & {
  details: LegacyAddressDetails,
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
        <USStateFormField {...ctx.fieldPropsFor('state')} />
        <TextualFormField {...ctx.fieldPropsFor('zipCode')} label="Zip code" />
        <ProgressButtons back={props.prevStep} isLoading={ctx.isLoading} />
      </>}
    </SessionUpdatingFormSubmitter>
  </>;
};

export const HPActionYourLandlord = MiddleProgressStep(props => {
  const {session} = useContext(AppContext);
  const details = session.landlordDetails;

  return (
    <Page title="Your landlord" withHeading className="content">
      {isUserNycha(session)
        ? <ReadOnlyLandlordDetails {...props} details={LEGACY_NYCHA_ADDRESS} />
        : details && details.isLookedUp && details.name && details.address
          ? <ReadOnlyLandlordDetails {...props} details={details} />
          : <EditableLandlordDetails {...props} />}
    </Page>
  );
});
