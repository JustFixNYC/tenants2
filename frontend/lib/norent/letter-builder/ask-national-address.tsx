import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentNationalAddressMutation } from "../../queries/NorentNationalAddressMutation";
import { TextualFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { AllSessionInfo } from "../../queries/AllSessionInfo";
import { NorentNationalAddressInput } from "../../queries/globalTypes";
import {
  createAptNumberFormInput,
  AptNumberFormFields,
} from "../../forms/apt-number-form-fields";

function getInitialState(s: AllSessionInfo): NorentNationalAddressInput {
  return {
    street: s.norentScaffolding?.street || s.onboardingInfo?.address || "",
    zipCode: s.norentScaffolding?.zipCode || s.onboardingInfo?.zipcode || "",
    ...createAptNumberFormInput(
      s.norentScaffolding?.street ?? s.onboardingInfo?.aptNumber
    ),
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
            <AptNumberFormFields
              aptNumberProps={ctx.fieldPropsFor("aptNumber")}
              noAptNumberProps={ctx.fieldPropsFor("noAptNumber")}
              aptNumberLabel="Unit/apt/suite number"
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
