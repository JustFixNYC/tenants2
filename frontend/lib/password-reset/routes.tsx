import React from "react";
import {
  ProgressRoutesProps,
  buildProgressRoutesComponent,
} from "../progress/progress-routes";
import JustfixRoutes from "../justfix-route-info";
import Page from "../ui/page";
import { LegacyFormSubmitter } from "../forms/legacy-form-submitter";
import {
  PasswordResetMutation,
  BlankPasswordResetInput,
} from "../queries/PasswordResetMutation";
import { PhoneNumberFormField } from "../forms/phone-number-form-field";
import { ProgressButtons } from "../ui/buttons";
import {
  PasswordResetVerificationCodeMutation,
  BlankPasswordResetVerificationCodeInput,
} from "../queries/PasswordResetVerificationCodeMutation";
import { TextualFormField } from "../forms/form-fields";
import {
  PasswordResetConfirmMutation,
  BlankPasswordResetConfirmInput,
} from "../queries/PasswordResetConfirmMutation";
import { Link } from "react-router-dom";
import { CustomerSupportLink } from "../ui/customer-support-link";

function getPasswordResetRoutesProps(): ProgressRoutesProps {
  return {
    toLatestStep: JustfixRoutes.locale.passwordReset.latestStep,
    label: "Reset your password",
    welcomeSteps: [],
    stepsToFillOut: [
      {
        path: JustfixRoutes.locale.passwordReset.start,
        exact: true,
        component: Start,
      },
      {
        path: JustfixRoutes.locale.passwordReset.verify,
        exact: true,
        component: Verify,
      },
      {
        path: JustfixRoutes.locale.passwordReset.confirm,
        exact: true,
        component: Confirm,
      },
    ],
    confirmationSteps: [
      {
        path: JustfixRoutes.locale.passwordReset.done,
        exact: true,
        component: Done,
      },
    ],
  };
}

function Start(props: {}) {
  return (
    <Page title="Having trouble logging in?">
      <h1 className="title is-4 is-spaced">Having trouble logging in?</h1>
      <p className="subtitle is-6">
        If you're having trouble logging in, we can reset your password. In
        order to do that, we'll need your phone number.
      </p>
      <LegacyFormSubmitter
        mutation={PasswordResetMutation}
        initialState={BlankPasswordResetInput}
        onSuccessRedirect={JustfixRoutes.locale.passwordReset.verify}
      >
        {(ctx) => (
          <>
            <PhoneNumberFormField
              label="Phone number"
              {...ctx.fieldPropsFor("phoneNumber")}
            />
            <ProgressButtons
              back={JustfixRoutes.locale.login}
              isLoading={ctx.isLoading}
            />
          </>
        )}
      </LegacyFormSubmitter>
    </Page>
  );
}

function Verify(props: {}) {
  return (
    <Page title="Verify your phone number">
      <h1 className="title is-4 is-spaced">Verify your phone number</h1>
      <p className="subtitle is-6">
        We've just sent you a text message containing a verification code.
        Please enter it below.
      </p>
      <LegacyFormSubmitter
        mutation={PasswordResetVerificationCodeMutation}
        initialState={BlankPasswordResetVerificationCodeInput}
        onSuccessRedirect={JustfixRoutes.locale.passwordReset.confirm}
      >
        {(ctx) => (
          <>
            <TextualFormField
              label="Verification code"
              {...ctx.fieldPropsFor("code")}
            />
            <br />
            <p>
              If you didn't receive a code, try checking your email. If it's not
              in there either, please email <CustomerSupportLink />.
            </p>
            <ProgressButtons
              back={JustfixRoutes.locale.passwordReset.start}
              isLoading={ctx.isLoading}
            />
          </>
        )}
      </LegacyFormSubmitter>
    </Page>
  );
}

function Confirm(props: {}) {
  return (
    <Page title="Set your new password">
      <h1 className="title is-4 is-spaced">Set your new password</h1>
      <p className="subtitle is-6">
        Hooray! The final step is to provide us with a new password.
      </p>
      <LegacyFormSubmitter
        mutation={PasswordResetConfirmMutation}
        initialState={BlankPasswordResetConfirmInput}
        onSuccessRedirect={JustfixRoutes.locale.passwordReset.done}
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
              back={JustfixRoutes.locale.passwordReset.verify}
              isLoading={ctx.isLoading}
            />
          </>
        )}
      </LegacyFormSubmitter>
    </Page>
  );
}

function Done(props: {}) {
  return (
    <Page title="Your password has been reset!">
      <h1 className="title is-4 is-spaced">Your password has been reset!</h1>
      <p className="subtitle is-6">
        You can now{" "}
        <Link to={JustfixRoutes.locale.login}>
          log in with your new password
        </Link>
        .
      </p>
    </Page>
  );
}

const PasswordResetRoutes = buildProgressRoutesComponent(
  getPasswordResetRoutesProps
);

export default PasswordResetRoutes;
