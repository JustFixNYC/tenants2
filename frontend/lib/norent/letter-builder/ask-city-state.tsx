import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { NorentCityStateMutation } from "../../queries/NorentCityStateMutation";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { TextualFormField } from "../../forms/form-fields";
import { USStateFormField } from "../../forms/mailing-address-fields";
import { ProgressButtons } from "../../ui/buttons";

export const NorentLbAskCityState = MiddleProgressStep((props) => {
  return (
    <Page
      title="What part of the United States do you live in?"
      withHeading="big"
    >
      <SessionUpdatingFormSubmitter
        mutation={NorentCityStateMutation}
        initialState={(s) => ({
          city: s.norentScaffolding?.city || s.onboardingInfo?.city || "",
          state: s.norentScaffolding?.state || s.onboardingInfo?.state || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField {...ctx.fieldPropsFor("city")} label="City" />
            <USStateFormField {...ctx.fieldPropsFor("state")} />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
