import React from "react";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { NorentFullLegalNameMutation } from "../queries/NorentFullLegalNameMutation";
import { TextualFormField } from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { MiddleProgressStepProps } from "../progress/progress-step-route";

export const AskNameStep: React.FC<MiddleProgressStepProps> = (props) => {
  return (
    <Page title={li18n._(t`It’s your first time here!`)} withHeading="big">
      <div className="content">
        <p>
          <Trans>Let's get to know you.</Trans>
        </p>
      </div>
      <br />
      <SessionUpdatingFormSubmitter
        mutation={NorentFullLegalNameMutation}
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
              label={li18n._(t`First name`)}
            />
            <TextualFormField
              {...ctx.fieldPropsFor("lastName")}
              label={li18n._(t`Last name`)}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};
