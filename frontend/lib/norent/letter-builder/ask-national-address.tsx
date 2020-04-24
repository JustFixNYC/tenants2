import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentNationalAddressMutation } from "../../queries/NorentNationalAddressMutation";
import { TextualFormField, CheckboxFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { NorentNationalAddressInput } from "../../queries/globalTypes";

function getInitialState(s: AllSessionInfo): NorentNationalAddressInput {
  const existingAptNumber =
    s.norentScaffolding?.street ?? s.onboardingInfo?.aptNumber;
  const noAptNumber = existingAptNumber === "" ? true : false;

  return {
    street: s.norentScaffolding?.street || s.onboardingInfo?.address || "",
    aptNumber: existingAptNumber || "",
    noAptNumber,
    zipCode: s.norentScaffolding?.zipCode || s.onboardingInfo?.zipcode || "",
  };
}

export const NorentLbAskNationalAddress = MiddleProgressStep((props) => {
  return (
    <Page title="Your residence" withHeading="big">
      <div className="content">
        <p>We'll include this information in the letter to your landlord.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentNationalAddressMutation}
        initialState={getInitialState}
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
            <CheckboxFormField {...ctx.fieldPropsFor("noAptNumber")}>
              I have no apartment number
            </CheckboxFormField>
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
