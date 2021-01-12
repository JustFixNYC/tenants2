import React from "react";
import {
  PasswordResetConfirmAndLoginMutation,
  BlankPasswordResetConfirmAndLoginInput,
} from "../queries/PasswordResetConfirmAndLoginMutation";
import { ProgressButtons } from "../ui/buttons";
import { TextualFormField } from "../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import Page from "../ui/page";
import { StartAccountOrLoginProps } from "./routes";
import { li18n } from "../i18n-lingui";
import { t, Trans } from "@lingui/macro";

export const SetPassword: React.FC<StartAccountOrLoginProps> = ({
  routes,
  nextStep,
}) => {
  return (
    <Page title={li18n._(t`Set your new password`)}>
      <h1 className="title is-4 is-spaced">
        <Trans>Set your password</Trans>
      </h1>
      <p className="subtitle is-6">
        <Trans>
          Let's set you up with a new password, so you can easily login again.
        </Trans>
      </p>
      <SessionUpdatingFormSubmitter
        mutation={PasswordResetConfirmAndLoginMutation}
        initialState={BlankPasswordResetConfirmAndLoginInput}
        onSuccessRedirect={nextStep}
      >
        {(ctx) => (
          <>
            <TextualFormField
              type="password"
              label={li18n._(t`New password`)}
              {...ctx.fieldPropsFor("password")}
            />
            <TextualFormField
              type="password"
              label={li18n._(t`Confirm your new password`)}
              {...ctx.fieldPropsFor("confirmPassword")}
            />
            <br />
            <ProgressButtons
              back={routes.verifyPhoneNumber}
              isLoading={ctx.isLoading}
            />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};
