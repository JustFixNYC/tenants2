import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { NorentEmailMutation } from "../../queries/NorentEmailMutation";
import { TextualFormField } from "../../forms/form-fields";
import { ProgressButtons } from "../../ui/buttons";
import { useIsOnboardingUserInStateWithProtections } from "./national-metadata";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";

export const NorentLbAskEmail = MiddleProgressStep((props) => {
  const isWritingLetter = useIsOnboardingUserInStateWithProtections();

  return (
    <Page title={li18n._(t`Your email address`)} withHeading="big">
      <div className="content">
        {isWritingLetter ? (
          <p>
            <Trans>
              We'll use this information to email you a copy of your letter.
            </Trans>
          </p>
        ) : (
          <p>
            <Trans>We'll use this information to send you updates.</Trans>
          </p>
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
              label={li18n._(t`Email address`)}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
