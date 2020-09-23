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
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

function getIntroText(isLookedUp: boolean | null): JSX.Element {
  return isLookedUp ? (
    <React.Fragment>
      <p className="subtitle is-6">
        <Trans>
          This is your landlord’s information as registered with the{" "}
          <b>NYC Department of Housing and Preservation (HPD)</b>. This may be
          different than where you send your rent checks.
        </Trans>
      </p>
      <p className="subtitle is-6">
        <Trans>
          We will use this address to ensure your landlord receives your letter.
        </Trans>
      </p>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <p className="subtitle is-6">
        <Trans>
          Please enter your landlord's name and contact information below. You
          can find this information on your lease and/or rent receipts.
        </Trans>
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
          <strong>
            <Trans>Landlord name</Trans>
          </strong>
        </dt>
        <dd>{details.name}</dd>
        <br />
        <dt>
          <strong>
            <Trans>Landlord address</Trans>
          </strong>
        </dt>
        <dd>
          <BreaksBetweenLines lines={details.address} />
        </dd>
      </dl>
      <ProgressButtons>
        <BackButton to={prevStep} />
        <Link to={nextStep} className="button is-primary is-medium">
          <Trans>Preview letter</Trans>
        </Link>
      </ProgressButtons>
    </div>
  );
}

const LandlordDetailsPage = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  const { landlordDetails } = session;
  return (
    <Page title={li18n._(t`Landlord information`)}>
      <div>
        <h1 className="title is-4 is-spaced">
          <Trans>Landlord information</Trans>
        </h1>
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
                BlankLandlordDetailsV2Input,
              )
            }
            onSuccessRedirect={props.nextStep}
          >
            {(ctx) => (
              <>
                <TextualFormField
                  label={li18n._(t`Landlord's name`)}
                  type="text"
                  {...ctx.fieldPropsFor("name")}
                />
                <TextualFormField
                  {...ctx.fieldPropsFor("primaryLine")}
                  label={li18n._(t`Street address`)}
                />
                <TextualFormField
                  {...ctx.fieldPropsFor("city")}
                  label={li18n._(t`City`)}
                />
                <USStateFormField {...ctx.fieldPropsFor("state")} />
                <TextualFormField
                  {...ctx.fieldPropsFor("zipCode")}
                  label={li18n._(t`Zip code`)}
                />
                <ProgressButtons
                  back={props.prevStep}
                  isLoading={ctx.isLoading}
                  nextLabel={li18n._(t`Preview letter`)}
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
