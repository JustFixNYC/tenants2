import React, { useContext } from 'react';
import { AllSessionInfo_landlordDetails } from '../queries/AllSessionInfo';
import { AppContext } from '../app-context';
import { ProgressStepProps } from '../progress-step-route';
import Page from '../page';

const LandlordDetails = (props: { details: AllSessionInfo_landlordDetails }) => (
  <>
    <p>This is your landlord’s information as registered with the <b>NYC Department of Housing and Preservation (HPD)</b>. This may be different than where you send your rent checks.</p>
    <dl>
      <dt>Name</dt>
      <dd>{props.details.name}</dd>
      <dt>Address</dt>
      <dd>{props.details.address}</dd>
    </dl>
    <p>We'll use these details to automatically fill out your HP Action forms!</p>
  </>
);

type HPActionYourLandlordProps = ProgressStepProps & {
  renderProgressButtons: (props: ProgressStepProps) => JSX.Element
};

export const HPActionYourLandlord = (props: HPActionYourLandlordProps) => {
  const {session} = useContext(AppContext);
  const details = session.landlordDetails;

  return (
    <Page title="Your landlord" withHeading className="content">
      {details && details.isLookedUp && details.name && details.address
        ? <LandlordDetails details={details} />
        : <p>We were unable to retrieve information from the <b>NYC Department of Housing and Preservation (HPD)</b> about your landlord, so you will need to fill out the information yourself once we give you the forms.</p>}
      {props.renderProgressButtons(props)}
    </Page>
  );
};
