import React from "react";
import Page from "../../ui/page";
import { ProgressButtons } from "../../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import {
  NorentCreateAccountMutation,
  BlankNorentCreateAccountInput,
} from "../../queries/NorentCreateAccountMutation";
import { CheckboxFormField, TextualFormField } from "../../forms/form-fields";
import { ModalLink } from "../../ui/modal";
import { NorentRoutes } from "../route-info";
import { PrivacyInfoModal } from "../../ui/privacy-info-modal";
import { trackSignup } from "../../analytics/track-signup";
import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";
import { useIsOnboardingUserInStateWithProtections } from "./national-metadata";
import { NorentOnboardingStep } from "./step-decorators";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";

export const NorentCreateAccount = NorentOnboardingStep((props) => {
  const isWritingLetter = useIsOnboardingUserInStateWithProtections();

  return (
    <Page title={li18n._(t`Set up an account`)} withHeading="big">
      <div className="content">
        {isWritingLetter ? (
          <p>
            <Trans>
              Let’s set you up with an account. An account will enable you to
              save your information, download your letter, and more.
            </Trans>
          </p>
        ) : (
          <p>
            <Trans>
              Let's set you up with an account. This will enable you to save
              your information, and receive updates.
            </Trans>
          </p>
        )}
      </div>
      <SessionUpdatingFormSubmitter
        mutation={NorentCreateAccountMutation}
        initialState={{ ...BlankNorentCreateAccountInput, canWeSms: true }}
        onSuccess={() => trackSignup(OnboardingInfoSignupIntent.NORENT)}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField
              label={li18n._(t`Password`)}
              type="password"
              {...ctx.fieldPropsFor("password")}
            />
            <TextualFormField
              label={li18n._(t`Confirm password`)}
              type="password"
              {...ctx.fieldPropsFor("confirmPassword")}
            />
            <CheckboxFormField {...ctx.fieldPropsFor("canWeSms")}>
              <Trans>
                Yes, JustFix.nyc can text me to follow up about my housing
                issues.
              </Trans>
            </CheckboxFormField>
            <CheckboxFormField {...ctx.fieldPropsFor("agreeToTerms")}>
              <Trans>
                I agree to the{" "}
                <ModalLink
                  to={NorentRoutes.locale.letter.createAccountTermsModal}
                  render={() => <PrivacyInfoModal />}
                >
                  NoRent.org terms and conditions
                </ModalLink>
                .
              </Trans>
            </CheckboxFormField>
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
