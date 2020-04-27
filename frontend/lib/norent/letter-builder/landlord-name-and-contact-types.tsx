import React, { useContext } from "react";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { TextualFormField, CheckboxFormField } from "../../forms/form-fields";
import { ProgressButtons, BackButton } from "../../ui/buttons";
import {
  MiddleProgressStep,
  MiddleProgressStepProps,
} from "../../progress/progress-step-route";
import { NorentLandlordNameAndContactTypesMutation } from "../../queries/NorentLandlordNameAndContactTypesMutation";
import { AllSessionInfo_landlordDetails } from "../../queries/AllSessionInfo";
import { Link } from "react-router-dom";
import { AppContext } from "../../app-context";
import { LetterBuilderAccordion } from "./welcome";
import { BreaksBetweenLines } from "../../ui/breaks-between-lines";

const ReadOnlyLandlordDetails: React.FC<
  MiddleProgressStepProps & { details: AllSessionInfo_landlordDetails }
> = ({ details, nextStep, prevStep }) => {
  return (
    <div className="content">
      <p>
        This is your landlord’s information as registered with the{" "}
        <b>NYC Department of Housing and Preservation (HPD)</b>. This may be
        different than where you send your rent checks.
      </p>
      <p>We will use this address to ensure your landlord receives it.</p>
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
          Next
        </Link>
      </ProgressButtons>
    </div>
  );
};

const NameAndContactTypesForm: React.FC<MiddleProgressStepProps> = (props) => (
  <>
    <p className="jf-space-below-2rem">
      We'll use this information to send your letter.
    </p>
    <br />
    <SessionUpdatingFormSubmitter
      mutation={NorentLandlordNameAndContactTypesMutation}
      initialState={(s) => ({
        name: s.landlordDetails?.name || "",
        hasEmailAddress:
          s.norentScaffolding?.hasLandlordEmailAddress ??
          !!s.landlordDetails?.email,
        hasMailingAddress:
          s.norentScaffolding?.hasLandlordMailingAddress ??
          !!s.landlordDetails?.address,
      })}
      onSuccessRedirect={props.nextStep}
    >
      {(ctx) => (
        <>
          <TextualFormField
            {...ctx.fieldPropsFor("name")}
            label="Landlord/management company's name"
          />
          <LetterBuilderAccordion question="Where do I find this information?">
            If you write checks or transfer money through your bank to pay your
            rent, use that name here.
          </LetterBuilderAccordion>
          <p>
            What contact information do you have for your landlord or building
            management?{" "}
            <span className="has-text-weight-bold">Choose all that apply.</span>
          </p>
          <CheckboxFormField {...ctx.fieldPropsFor("hasEmailAddress")}>
            Email address{" "}
            <span className="has-text-weight-bold">(recommended)</span>
          </CheckboxFormField>
          <CheckboxFormField {...ctx.fieldPropsFor("hasMailingAddress")}>
            Mailing address
          </CheckboxFormField>
          <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
        </>
      )}
    </SessionUpdatingFormSubmitter>
  </>
);

export const NorentLandlordNameAndContactTypes = MiddleProgressStep((props) => {
  const { session } = useContext(AppContext);
  return (
    <Page
      title="Your landlord or management company's information"
      withHeading="big"
      className="content"
    >
      {session.landlordDetails?.isLookedUp ? (
        <ReadOnlyLandlordDetails {...props} details={session.landlordDetails} />
      ) : (
        <NameAndContactTypesForm {...props} />
      )}
    </Page>
  );
});
