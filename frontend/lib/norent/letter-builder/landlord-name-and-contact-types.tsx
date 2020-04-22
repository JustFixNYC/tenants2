import React from "react";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { TextualFormField, CheckboxFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import { NorentLandlordNameAndContactTypesMutation } from "../../queries/NorentLandlordNameAndContactTypesMutation";

export const NorentLandlordNameAndContactTypes = MiddleProgressStep((props) => {
  return (
    <Page
      title="Your landlord or management company's information"
      withHeading="big"
      className="content"
    >
      <p>We'll use this information to send your letter.</p>
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
            <p>
              What contact information do you have for your landlord or building
              management? <strong>Choose all that apply.</strong>
            </p>
            <CheckboxFormField {...ctx.fieldPropsFor("hasEmailAddress")}>
              Email address
            </CheckboxFormField>
            <CheckboxFormField {...ctx.fieldPropsFor("hasMailingAddress")}>
              Mailing address
            </CheckboxFormField>
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
