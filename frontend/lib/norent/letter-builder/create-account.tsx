import React from "react";
import { MiddleProgressStep } from "../../progress/progress-step-route";
import Page from "../../ui/page";
import { ProgressButtons } from "../../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import {
  NorentCreateAccountMutation,
  BlankNorentCreateAccountInput,
} from "../../queries/NorentCreateAccountMutation";
import { CheckboxFormField, TextualFormField } from "../../forms/form-fields";
import { ModalLink } from "../../ui/modal";
import { NorentRoutes } from "../routes";
import { PrivacyInfoModal } from "../../ui/privacy-info-modal";
import { trackSignup } from "../../analytics/track-signup";
import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";

export const NorentCreateAccount = MiddleProgressStep((props) => {
  return (
    <Page title="Set up an account" withHeading="big">
      <div className="content">
        <p>
          Let’s set you up with an account. An account will enable you to save
          your information, download your letter, and more.
        </p>
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
              label="Password"
              type="password"
              {...ctx.fieldPropsFor("password")}
            />
            <TextualFormField
              label="Confirm password"
              type="password"
              {...ctx.fieldPropsFor("confirmPassword")}
            />
            <CheckboxFormField {...ctx.fieldPropsFor("canWeSms")}>
              Yes, JustFix.nyc can text me to follow up about my housing issues.
            </CheckboxFormField>
            <CheckboxFormField {...ctx.fieldPropsFor("agreeToTerms")}>
              I agree to the{" "}
              <ModalLink
                to={NorentRoutes.locale.letter.createAccountTermsModal}
                render={() => <PrivacyInfoModal isForNorentSite />}
              >
                JustFix.nyc terms and conditions
              </ModalLink>
              .
            </CheckboxFormField>
            <ProgressButtons isLoading={ctx.isLoading} back={props.prevStep} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
});
