import React from "react";
import Page from "../ui/page";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { TextualFormField } from "../forms/form-fields";
import { ProgressButtons } from "../ui/buttons";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";
import { MiddleProgressStepProps } from "../progress/progress-step-route";
import { NorentFullLegalAndPreferredNameMutation } from "../queries/NorentFullLegalAndPreferredNameMutation";
import { optionalizeLabel } from "../forms/optionalize-label";
import { Accordion } from "../ui/accordion";
import { TermsOfUseLink } from "../ui/privacy-info-modal";

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
        mutation={NorentFullLegalAndPreferredNameMutation}
        initialState={(s) => ({
          firstName: s.onboardingScaffolding?.firstName || s.firstName || "",
          lastName: s.onboardingScaffolding?.lastName || s.lastName || "",
          preferredFirstName:
            s.onboardingScaffolding?.preferredFirstName ||
            s.preferredFirstName ||
            "",
        })}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField
              {...ctx.fieldPropsFor("firstName")}
              label={li18n._(t`Legal first name`)}
            />
            <TextualFormField
              {...ctx.fieldPropsFor("lastName")}
              label={li18n._(t`Legal last name`)}
            />
            <TextualFormField
              {...ctx.fieldPropsFor("preferredFirstName")}
              label={optionalizeLabel(li18n._(t`Preferred first name`))}
            />
            <Accordion
              question={li18n._(t`Why do I need to create an account?`)}
              extraClassName=""
            >
              <div className="content">
                <Trans id="justfix.whyIsAccountNeeded">
                  An account allows you to securely create, send and access
                  letters that help you exercise your tenant rights.
                </Trans>
              </div>
            </Accordion>
            <Accordion
              question={li18n._(t`How do you protect my personal information?`)}
              extraClassName=""
            >
              <div className="content">
                <Trans id="justfix.howIsPersonalInfoProtectedV2">
                  Everything on JustFix is secure. We don’t use your personal
                  information for profit or sell it to third parties. See our{" "}
                  <TermsOfUseLink />.
                </Trans>
              </div>
            </Accordion>
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};
