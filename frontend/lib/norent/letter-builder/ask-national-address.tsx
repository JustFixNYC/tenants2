import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentNationalAddressMutation } from "../../queries/NorentNationalAddressMutation";
import { TextualFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";

export const NorentLbAskNationalAddress = MiddleProgressStep((props) => {
  return (
    <Page title="Your residence" withHeading="big">
      <div className="content">
        <p>We'll include this information in the letter to your landlord.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentNationalAddressMutation}
        initialState={(s) => ({
          street:
            s.norentScaffolding?.street || s.onboardingInfo?.address || "",
          aptNumber:
            s.norentScaffolding?.aptNumber || s.onboardingInfo?.aptNumber || "",
          zipCode:
            s.norentScaffolding?.zipCode || s.onboardingInfo?.zipcode || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField
              {...ctx.fieldPropsFor("street")}
              label="Address"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("aptNumber")}
              label="Unit/apt/suite number"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("zipCode")}
              label="Zip code"
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
