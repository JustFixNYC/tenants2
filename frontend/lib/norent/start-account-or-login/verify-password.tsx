import React, { useContext } from "react";
import { LegacyFormSubmitter } from "../../forms/legacy-form-submitter";
import { LoginMutation, BlankLoginInput } from "../../queries/LoginMutation";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { Link, Route } from "react-router-dom";
import { PasswordResetMutation } from "../../queries/PasswordResetMutation";
import { AppContext } from "../../app-context";
import { ProgressButtons, NextButton } from "../../ui/buttons";
import { TextualFormField, HiddenFormField } from "../../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import Page from "../../ui/page";
import { StartAccountOrLoginProps } from "./steps";

const ForgotPasswordModal: React.FC<StartAccountOrLoginProps> = ({
  routes,
}) => {
  const { session } = useContext(AppContext);
  return (
    <Modal
      title="Reset your password"
      onCloseGoTo={BackOrUpOneDirLevel}
      withHeading
      render={(modalCtx) => (
        <>
          <div className="content">
            <p>
              To begin the password reset process, we'll text you a verification
              code.
            </p>
          </div>
          <LegacyFormSubmitter
            formId="resetPassword"
            mutation={PasswordResetMutation}
            initialState={{ phoneNumber: session.lastQueriedPhoneNumber || "" }}
            onSuccessRedirect={routes.verifyPhoneNumber}
          >
            {(ctx) => (
              <>
                <HiddenFormField {...ctx.fieldPropsFor("phoneNumber")} />
                <div className="buttons jf-two-buttons">
                  <Link
                    {...modalCtx.getLinkCloseProps()}
                    className="button is-medium jf-is-back-button"
                  >
                    Go back
                  </Link>
                  <NextButton isLoading={ctx.isLoading} label="Send code" />
                </div>
              </>
            )}
          </LegacyFormSubmitter>
        </>
      )}
    />
  );
};

export const VerifyPassword: React.FC<StartAccountOrLoginProps> = ({
  routes,
  ...props
}) => {
  return (
    <Page title="You already have an account" withHeading="big">
      <div className="content">
        <p>
          Now we just need your password. This is the same one you’ve used on
          JustFix.nyc.
        </p>
      </div>
      <SessionUpdatingFormSubmitter
        formId="login"
        mutation={LoginMutation}
        initialState={(s) => ({
          ...BlankLoginInput,
          phoneNumber: s.lastQueriedPhoneNumber || "",
        })}
        onSuccessRedirect={(output, input) => props.nextStep}
      >
        {(ctx) => (
          <>
            <HiddenFormField {...ctx.fieldPropsFor("phoneNumber")} />
            <TextualFormField
              label="Password"
              type="password"
              {...ctx.fieldPropsFor("password")}
            />
            <div className="content">
              <Link
                to={routes.forgotPasswordModal}
                className="is-size-6 has-text-weight-normal"
              >
                I forgot my password
              </Link>
            </div>
            <ProgressButtons
              isLoading={ctx.isLoading}
              back={routes.phoneNumber}
            />
          </>
        )}
      </SessionUpdatingFormSubmitter>
      <Route
        path={routes.forgotPasswordModal}
        render={() => <ForgotPasswordModal routes={routes} {...props} />}
        exact
      />
    </Page>
  );
};
