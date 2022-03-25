import React from "react";
import Page from "../../ui/page";
import { ProgressButtons } from "../../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { CheckboxFormField, TextualFormField } from "../../forms/form-fields";
import { ModalLink } from "../../ui/modal";
import { LaLetterBuilderRouteInfo } from "../route-info";
import { PrivacyInfoModal } from "../../ui/privacy-info-modal";
import { trackSignup } from "../../analytics/track-signup";
import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";
import { LaLetterBuilderOnboardingStep } from "../letter-builder/step-decorators";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import {
  BlankLaLetterBuilderCreateAccountInput,
  LaLetterBuilderCreateAccountMutation,
} from "../../queries/LaLetterBuilderCreateAccountMutation";
import { CreatePasswordFields } from "../../common-steps/create-password";
import { optionalizeLabel } from "../../forms/optionalize-label";

export const LaLetterBuilderCreateAccount = LaLetterBuilderOnboardingStep(
  (props) => {
    return (
      <Page title={li18n._(t`Set up an account`)} withHeading="big">
        <div className="content">
          <p>
            Let’s set you up with an account. An account will enable you to save
            your information and download copies of your letters.
          </p>
        </div>
        <SessionUpdatingFormSubmitter
          mutation={LaLetterBuilderCreateAccountMutation}
          initialState={{
            ...BlankLaLetterBuilderCreateAccountInput,
            canWeSms: true,
            email: "",
          }}
          onSuccess={() =>
            trackSignup(OnboardingInfoSignupIntent.LALETTERBUILDER)
          }
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => (
            <>
              <TextualFormField
                type="email"
                {...ctx.fieldPropsFor("email")}
                label={optionalizeLabel(li18n._(t`Email address`))}
              />
              <CreatePasswordFields
                passwordProps={ctx.fieldPropsFor("password")}
                confirmPasswordProps={ctx.fieldPropsFor("confirmPassword")}
              />
              <CheckboxFormField {...ctx.fieldPropsFor("agreeToTerms")}>
                I agree to the{" "}
                <ModalLink
                  to={
                    LaLetterBuilderRouteInfo.locale.habitability // pass this in instead
                      .createAccountTermsModal
                  }
                  render={() => <PrivacyInfoModal />}
                >
                  LaLetterBuilder.org terms and conditions
                </ModalLink>
                .
              </CheckboxFormField>
              <CheckboxFormField {...ctx.fieldPropsFor("canWeSms")}>
                <Trans>
                  Yes, JustFix.nyc can text me to follow up about my housing
                  issues.
                </Trans>
              </CheckboxFormField>
              <ProgressButtons
                isLoading={ctx.isLoading}
                back={props.prevStep}
              />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </Page>
    );
  }
);
