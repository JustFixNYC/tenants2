import React from "react";
import Page from "../../ui/page";
import { ProgressButtons } from "../../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { CheckboxFormField, TextualFormField } from "../../forms/form-fields";
import { ModalLink } from "../../ui/modal";
import { EvictionFreeRoutes } from "../route-info";
import { PrivacyInfoModal } from "../../ui/privacy-info-modal";
import { trackSignup } from "../../analytics/track-signup";
import { OnboardingInfoSignupIntent } from "../../queries/globalTypes";
import { EvictionFreeOnboardingStep } from "./step-decorators";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../../i18n-lingui";
import {
  BlankEvictionFreeCreateAccountInput,
  EvictionFreeCreateAccountMutation,
} from "../../queries/EvictionFreeCreateAccountMutation";
import { CreatePasswordFields } from "../../common-steps/create-password";

export const EvictionFreeCreateAccount = EvictionFreeOnboardingStep((props) => {
  return (
    <Page title={li18n._(t`Set up an account`)} withHeading="big">
      <div className="content">
        <p>
          <Trans>
            Let’s set you up with an account. An account will enable you to save
            your information, download your declaration, and more.
          </Trans>
        </p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={EvictionFreeCreateAccountMutation}
        initialState={{
          ...BlankEvictionFreeCreateAccountInput,
          canWeSms: true,
        }}
        onSuccess={() => trackSignup(OnboardingInfoSignupIntent.EVICTIONFREE)}
        onSuccessRedirect={props.nextStep}
      >
        {(ctx) => (
          <>
            <CreatePasswordFields {ctx=ctx.fieldPropsFor("password")}> 
            <CheckboxFormField {...ctx.fieldPropsFor("canWeSms")}>
              <Trans>
                Yes, Right to Counsel NYC Coalition, Housing Justice for All,
                and JustFix.nyc can text me to follow up about my housing
                issues.
              </Trans>
            </CheckboxFormField>
            <CheckboxFormField {...ctx.fieldPropsFor("agreeToTerms")}>
              <Trans>
                I agree to the{" "}
                <ModalLink
                  to={
                    EvictionFreeRoutes.locale.declaration
                      .createAccountTermsModal
                  }
                  render={() => <PrivacyInfoModal />}
                >
                  Eviction Free NY terms and conditions
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
