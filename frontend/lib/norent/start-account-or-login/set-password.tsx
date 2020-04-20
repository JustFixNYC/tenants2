import React from "react";
import {
  PasswordResetConfirmAndLoginMutation,
  BlankPasswordResetConfirmAndLoginInput,
} from "../../queries/PasswordResetConfirmAndLoginMutation";
import { ProgressButtons } from "../../ui/buttons";
import { TextualFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import Page from "../../ui/page";
import { StartAccountOrLoginProps } from "./steps";

export const SetPassword: React.FC<StartAccountOrLoginProps> = ({
  routes,
  toNextPhase,
}) => {
  return (
    <Page title="Set your new password">
      <h1 className="title is-4 is-spaced">Set your password</h1>
      <p className="subtitle is-6">
        Let's set you up with a new password, so you can easily login again.
      </p>
      <SessionUpdatingFormSubmitter
        mutation={PasswordResetConfirmAndLoginMutation}
        initialState={BlankPasswordResetConfirmAndLoginInput}
        onSuccessRedirect={toNextPhase}
      >
        {(ctx) => (
          <>
            <TextualFormField
              type="password"
              label="New password"
              {...ctx.fieldPropsFor("password")}
            />
            <TextualFormField
              type="password"
              label="Confirm your new password"
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
