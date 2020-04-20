import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentFullNameMutation } from "../../queries/NorentFullNameMutation";
import { TextualFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";

export const NorentLbAskName = MiddleProgressStep((props) => {
  return (
    <Page title="Welcome!" withHeading="big">
      <div className="content">
        <p>Let's start off by getting to know you.</p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentFullNameMutation}
        initialState={(s) => ({
          firstName: s.norentScaffolding?.firstName || s.firstName || "",
          lastName: s.norentScaffolding?.lastName || s.lastName || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField
              {...ctx.fieldPropsFor("firstName")}
              label="First name"
            />
            <TextualFormField
              {...ctx.fieldPropsFor("lastName")}
              label="Last name"
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
