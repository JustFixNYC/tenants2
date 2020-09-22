import React, { useContext } from "react";

import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { TextualFormField } from "../forms/form-fields";

import { BackButton, ProgressButtons } from "../ui/buttons";
import { AppContext } from "../app-context";
import { exactSubsetOrDefault } from "../util/util";
import { Link } from "react-router-dom";
import { AllSessionInfo_landlordDetails } from "../queries/AllSessionInfo";
import {
  LandlordDetailsV2Mutation,
  BlankLandlordDetailsV2Input,
} from "../queries/LandlordDetailsV2Mutation";
import { USStateFormField } from "../forms/mailing-address-fields";
import { MiddleProgressStep } from "../progress/progress-step-route";
import { BreaksBetweenLines } from "../ui/breaks-between-lines";

function getIntroText(isLookedUp: boolean | null): JSX.Element {
  return isLookedUp ? (
    <React.Fragment>
      <p className="subtitle is-6">
        This is your landlord’s information as registered with the{" "}
        <b>NYC Department of Housing and Preservation (HPD)</b>. This may be
        different than where you send your rent checks.
      </p>
      <p className="subtitle is-6">
        We will use this address to ensure your landlord receives your letter.
      </p>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <p className="subtitle is-6">
        Please enter your landlord's name and contact information below. You can
        find this information on your lease and/or rent receipts.
      </p>
    </React.Fragment>
  );
}

function ReadOnlyLandlordDetails(props: {
  details: AllSessionInfo_landlordDetails;
  nextStep: string;
  prevStep: string;
}): JSX.Element {
  const { details, nextStep, prevStep } = props;
  return (
    <div className="content">
      <dl>
        <dt>
          <strong>Landlord name</strong>
        </dt>
        <dd>{details.name}</dd>
        <br />
        <dt>
          <strong>Landlord address</strong>
        </dt>
        <dd>
          <BreaksBetweenLines lines={details.address} />
        </dd>
      </dl>
      <ProgressButtons>
        <BackButton to={prevStep} />
        <Link to={nextStep} className="button is-primary is-medium">
          Preview letter
        </Link>
      </ProgressButtons>
    </div>
  );
}

const LandlordDetailsPage = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const { landlordDetails } = session;
  return (
    <Page title="Landlord information">
      <div>
        <h1 className="title is-4 is-spaced">Landlord information</h1>
        {getIntroText(landlordDetails && landlordDetails.isLookedUp)}
        {landlordDetails && landlordDetails.isLookedUp ? (
          <ReadOnlyLandlordDetails
            details={landlordDetails}
            nextStep={props.nextStep}
            prevStep={props.prevStep}
          />
        ) : (
          <SessionUpdatingFormSubmitter
            mutation={LandlordDetailsV2Mutation}
            initialState={(session) =>
              exactSubsetOrDefault(
                session.landlordDetails,
                BlankLandlordDetailsV2Input
              )
            }
            onSuccessRedirect={props.nextStep}
          >
            {(ctx) => (
              <>
                <TextualFormField
                  label="Landlord's name"
                  type="text"
                  {...ctx.fieldPropsFor("name")}
                />
                <TextualFormField
                  {...ctx.fieldPropsFor("primaryLine")}
                  label="Street address"
                />
                <TextualFormField {...ctx.fieldPropsFor("city")} label="City" />
                <USStateFormField {...ctx.fieldPropsFor("state")} />
                <TextualFormField
                  {...ctx.fieldPropsFor("zipCode")}
                  label="Zip code"
                />
                <ProgressButtons
                  back={props.prevStep}
                  isLoading={ctx.isLoading}
                  nextLabel="Preview letter"
                />
              </>
            )}
          </SessionUpdatingFormSubmitter>
        )}
      </div>
    </Page>
  );
});

export default LandlordDetailsPage;
