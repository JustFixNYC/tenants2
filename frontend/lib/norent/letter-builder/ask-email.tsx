import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentEmailMutation } from "../../queries/NorentEmailMutation";
import { TextualFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { useIsOnboardingUserInStateWithProtections } from "./national-metadata";

export const NorentLbAskEmail = MiddleProgressStep((props) => {
  const isWritingLetter = useIsOnboardingUserInStateWithProtections();

  return (
    <Page title="Your email address" withHeading="big">
      <div className="content">
        {isWritingLetter ? (
          <p>We'll use this information to email you a copy of your letter.</p>
        ) : (
          <p>We'll use this information to send you updates.</p>
        )}
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentEmailMutation}
        initialState={(s) => ({
          email: s.norentScaffolding?.email || s.email || "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField
              type="email"
              {...ctx.fieldPropsFor("email")}
              label="Email address"
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
