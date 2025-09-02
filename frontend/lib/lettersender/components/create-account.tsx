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
      <Page title={li18n._(t`Finish creating your account`)} withHeading="big">
        <SessionUpdatingFormSubmitter
          mutation={LaLetterBuilderCreateAccountMutation}
          initialState={{
            ...BlankLaLetterBuilderCreateAccountInput,
            canWeSms: true,
            email: "",
          }}
          onSuccess={() => trackSignup(OnboardingInfoSignupIntent.LETTERSENDER)}
          onSuccessRedirect={props.nextStep}
        >
          {(ctx) => (
            <>
              <CreatePasswordFields
                passwordProps={ctx.fieldPropsFor("password")}
                confirmPasswordProps={ctx.fieldPropsFor("confirmPassword")}
              />
              <div className="content">
                <p>
                  <Trans>
                    If you add your email address now, we'll email you a copy of
                    your completed letter.
                  </Trans>
                </p>
              </div>
              <TextualFormField
                type="email"
                {...ctx.fieldPropsFor("email")}
                label={optionalizeLabel(li18n._(t`Email address`))}
              />
              <CheckboxFormField {...ctx.fieldPropsFor("canWeSms")}>
                <Trans>
                  JustFix can text me to follow up about my housing issues.
                </Trans>
              </CheckboxFormField>
              <CheckboxFormField {...ctx.fieldPropsFor("agreeToTerms")}>
                <Trans>
                  I agree to the JustFix{" "}
                  <ModalLink
                    to={
                      LaLetterBuilderRouteInfo.locale.habitability // pass this in instead
                        .createAccountTermsModal
                    }
                    render={() => <PrivacyInfoModal />}
                  >
                    Terms of Use
                  </ModalLink>
                  .
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
