import React, { useContext } from "react";
import { CustomerSupportLink } from "../../ui/customer-support-link";
import { LegacyFormSubmitter } from "../../forms/legacy-form-submitter";
import {
  PasswordResetVerificationCodeMutation,
  BlankPasswordResetVerificationCodeInput,
} from "../../queries/PasswordResetVerificationCodeMutation";
import { LoginMutation, BlankLoginInput } from "../../queries/LoginMutation";
import { Modal, BackOrUpOneDirLevel } from "../../ui/modal";
import { CenteredButtons } from "../../ui/centered-buttons";
import { Link, Route } from "react-router-dom";
import { PasswordResetMutation } from "../../queries/PasswordResetMutation";
import { AppContext } from "../../app-context";
import {
  PasswordResetConfirmAndLoginMutation,
  BlankPasswordResetConfirmAndLoginInput,
} from "../../queries/PasswordResetConfirmAndLoginMutation";
import { QueryOrVerifyPhoneNumberMutation } from "../../queries/QueryOrVerifyPhoneNumberMutation";
import { PhoneNumberAccountStatus } from "../../queries/globalTypes";
import { PhoneNumberFormField } from "../../forms/phone-number-form-field";
import { StartAccountOrLoginRouteInfo } from "./routes";
import { ProgressButtons, NextButton } from "../../ui/buttons";
import { TextualFormField, HiddenFormField } from "../../forms/form-fields";
import { ProgressStepRoute } from "../../progress/progress-step-route";
import { SessionUpdatingFormSubmitter } from "../../forms/session-updating-form-submitter";
import { assertNotNull } from "../../util/util";
import Page from "../../ui/page";
import { AllSessionInfo } from "../../queries/AllSessionInfo";

type StartAccountOrLoginProps = {
  routes: StartAccountOrLoginRouteInfo;
  toNextPhase: string;
  toPreviousPhase: string;
};

function getRouteForAccountStatus(
  { routes, toNextPhase }: StartAccountOrLoginProps,
  status: PhoneNumberAccountStatus
): string {
  switch (status) {
    case PhoneNumberAccountStatus.NO_ACCOUNT:
      return toNextPhase;
    case PhoneNumberAccountStatus.ACCOUNT_WITH_PASSWORD:
      return routes.verifyPassword;
    case PhoneNumberAccountStatus.ACCOUNT_WITHOUT_PASSWORD:
      return routes.verifyPhoneNumber;
  }
}

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
                <CenteredButtons>
                  <NextButton isLoading={ctx.isLoading} label="Send code" />
                  <Link
                    {...modalCtx.getLinkCloseProps()}
                    className="button is-text"
                  >
                    Go back
                  </Link>
                </CenteredButtons>
              </>
            )}
          </LegacyFormSubmitter>
        </>
      )}
    />
  );
};

const VerifyPassword: React.FC<StartAccountOrLoginProps> = ({
  routes,
  ...props
}) => {
  return (
    <Page title="You already have an account" withHeading="big">
      <div className="content">
        <p>
          Now we just need your password. (If you've used JustFix.nyc, this is
          the same password you use there.)
        </p>
      </div>
      <SessionUpdatingFormSubmitter
        formId="login"
        mutation={LoginMutation}
        initialState={(s) => ({
          ...BlankLoginInput,
          phoneNumber: s.lastQueriedPhoneNumber || "",
        })}
        onSuccessRedirect={(output, input) => props.toNextPhase}
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
              <p>
                If you don't remember it, you can{" "}
                <Link to={routes.forgotPasswordModal}>reset your password</Link>
                .
              </p>
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

const SetPassword: React.FC<StartAccountOrLoginProps> = ({
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

const VerifyPhoneNumber: React.FC<StartAccountOrLoginProps> = ({ routes }) => {
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

const AskPhoneNumber: React.FC<StartAccountOrLoginProps> = (props) => {
  return (
    <Page title="Your phone number" withHeading="big">
      <div className="content">
        <p>
          Whether it's your first time here, or you're a returning user, let's
          start with your number.
        </p>
      </div>
      <SessionUpdatingFormSubmitter
        mutation={QueryOrVerifyPhoneNumberMutation}
        initialState={(s) => ({ phoneNumber: s.lastQueriedPhoneNumber || "" })}
        onSuccessRedirect={(output) =>
          getRouteForAccountStatus(props, assertNotNull(output.accountStatus))
        }
      >
        {(ctx) => (
          <>
            <PhoneNumberFormField
              {...ctx.fieldPropsFor("phoneNumber")}
              label="Phone number"
            />
            <ProgressButtons
              isLoading={ctx.isLoading}
              back={props.toPreviousPhase}
            />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};

export function createStartAccountOrLoginSteps(
  props: StartAccountOrLoginProps
): ProgressStepRoute[] {
  const { routes } = props;
  return [
    {
      path: routes.phoneNumber,
      exact: true,
      shouldBeSkipped: isUserLoggedIn,
      render: () => <AskPhoneNumber {...props} />,
    },
    {
      path: routes.verifyPassword,
      shouldBeSkipped: isUserLoggedIn,
      render: () => <VerifyPassword {...props} />,
    },
    {
      path: routes.verifyPhoneNumber,
      exact: true,
      shouldBeSkipped: isUserLoggedIn,
      render: () => <VerifyPhoneNumber {...props} />,
    },
    {
      path: routes.setPassword,
      exact: true,
      shouldBeSkipped: isUserLoggedIn,
      render: () => <SetPassword {...props} />,
    },
  ];
}

function isUserLoggedIn(s: AllSessionInfo): boolean {
  return !!s.phoneNumber;
}
