import React from "react";
import { CustomerSupportLink } from "../../ui/customer-support-link";
import { LegacyFormSubmitter } from "../../forms/legacy-form-submitter";
import {
  PasswordResetVerificationCodeMutation,
  BlankPasswordResetVerificationCodeInput,
} from "../../queries/PasswordResetVerificationCodeMutation";
import { ProgressButtons } from "../../ui/buttons";
import { TextualFormField } from "../../forms/form-fields";
import Page from "../../ui/page";
import { StartAccountOrLoginProps } from "./steps";
import { li18n } from "../../i18n-lingui";
import { t, Trans } from "@lingui/macro";

export const VerifyPhoneNumber: React.FC<StartAccountOrLoginProps> = ({
  routes,
}) => {
  return (
    <Page title={li18n._(t`Verify your phone number`)} withHeading="big">
      <div className="content">
        <p>
          <Trans>
            We've just sent you a text message containing a verification code.
            Please enter it below.
          </Trans>
        </p>
      </div>
      <LegacyFormSubmitter
        mutation={PasswordResetVerificationCodeMutation}
        initialState={BlankPasswordResetVerificationCodeInput}
        onSuccessRedirect={routes.setPassword}
      >
        {(ctx) => (
          <>
            <TextualFormField
              label={li18n._(t`Verification code`)}
              {...ctx.fieldPropsFor("code")}
            />
            <div className="content">
              <p>
                <Trans>
                  If you didn't receive a code, please contact{" "}
                  <CustomerSupportLink />.
                </Trans>
              </p>
            </div>

            <ProgressButtons
              isLoading={ctx.isLoading}
              back={routes.phoneNumber}
            />
          </>
        )}
      </LegacyFormSubmitter>
    </Page>
  );
};
