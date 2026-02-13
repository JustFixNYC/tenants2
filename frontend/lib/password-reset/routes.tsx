import React from "react";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";
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
    label: li18n._(t`Reset your password`),
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
    <Page title={li18n._(t`Having trouble logging in?`)}>
      <h1 className="title is-4 is-spaced">
        <Trans>Having trouble logging in?</Trans>
      </h1>
      <p className="subtitle is-6">
        <Trans>
          If you're having trouble logging in, we can reset your password. In
          order to do that, we'll need your phone number.
        </Trans>
      </p>
      <LegacyFormSubmitter
        mutation={PasswordResetMutation}
        initialState={BlankPasswordResetInput}
        onSuccessRedirect={JustfixRoutes.locale.passwordReset.verify}
      >
        {(ctx) => (
          <>
            <PhoneNumberFormField
              label={li18n._(t`Phone number`)}
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
    <Page title={li18n._(t`Verify your phone number`)}>
      <h1 className="title is-4 is-spaced">
        <Trans>Verify your phone number</Trans>
      </h1>
      <p className="subtitle is-6">
        <Trans>
          We've just sent you a text message containing a verification code.
          Please enter it below.
        </Trans>
      </p>
      <LegacyFormSubmitter
        mutation={PasswordResetVerificationCodeMutation}
        initialState={BlankPasswordResetVerificationCodeInput}
        onSuccessRedirect={JustfixRoutes.locale.passwordReset.confirm}
      >
        {(ctx) => (
          <>
            <TextualFormField
              label={li18n._(t`Verification code`)}
              {...ctx.fieldPropsFor("code")}
            />
            <br />
            <p>
              <Trans>
                If you didn't receive a code, try checking your email. If it's
                not in there either, please email <CustomerSupportLink />.
              </Trans>
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
    <Page title={li18n._(t`Set your new password`)}>
      <h1 className="title is-4 is-spaced">
        <Trans>Set your new password</Trans>
      </h1>
      <p className="subtitle is-6">
        <Trans>Hooray! The final step is to provide us with a new password.</Trans>
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
    <Page title={li18n._(t`Your password has been reset!`)}>
      <h1 className="title is-4 is-spaced">
        <Trans>Your password has been reset!</Trans>
      </h1>
      <p className="subtitle is-6">
        <Trans>
          You can now{" "}
          <Link to={JustfixRoutes.locale.login}>
            log in with your new password
          </Link>
          .
        </Trans>
      </p>
    </Page>
  );
}

const PasswordResetRoutes = buildProgressRoutesComponent(
  getPasswordResetRoutesProps
);

export default PasswordResetRoutes;
