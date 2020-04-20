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

export const VerifyPhoneNumber: React.FC<StartAccountOrLoginProps> = ({
  routes,
}) => {
  return (
    <Page title="Verify your phone number" withHeading="big">
      <div className="content">
        <p>
          We've just sent you a text message containing a verification code.
          Please enter it below.
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
              label="Verification code"
              {...ctx.fieldPropsFor("code")}
            />
            <div className="content">
              <p>
                If you didn't receive a code, please contact{" "}
                <CustomerSupportLink />.
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
