import React from "react";
import { MiddleProgressStepProps } from "../progress/progress-step-route";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { NorentEmailMutation } from "../queries/NorentEmailMutation";
import { TextualFormField } from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { li18n } from "../i18n-lingui";
import { t } from "@lingui/macro";
import { NorentOptionalEmailMutation } from "../queries/NorentOptionalEmailMutation";

export const AskEmail: React.FC<
  MiddleProgressStepProps & {
    children: JSX.Element;
    isOptional?: boolean;
  }
> = (props) => {
  let mutation: typeof NorentEmailMutation = NorentEmailMutation;
  let label = li18n._(t`Email address`);

  if (props.isOptional) {
    mutation = NorentOptionalEmailMutation;
    label += " " + li18n._(t`(optional)`);
  }

  return (
    <Page title={li18n._(t`Your email address`)} withHeading="big">
      <div className="content">{props.children}</div>
      <SessionUpdatingFormSubmitter
        mutation={mutation}
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
              label={label}
            />
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};
