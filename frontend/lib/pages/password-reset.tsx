import React from 'react';
import { ProgressRoutesProps, buildProgressRoutesComponent } from "../progress-routes";
import Routes from "../routes";
import { OutboundLink } from '../google-analytics';
import Page from '../page';
import { LegacyFormSubmitter } from '../forms';
import { PasswordResetMutation } from '../queries/PasswordResetMutation';
import { PhoneNumberFormField } from '../phone-number-form-field';
import { BackButton, NextButton } from '../buttons';
import { PasswordResetVerificationCodeMutation } from '../queries/PasswordResetVerificationCodeMutation';
import { TextualFormField } from '../form-fields';
import { PasswordResetConfirmMutation } from '../queries/PasswordResetConfirmMutation';
import { Link } from 'react-router-dom';

function getPasswordResetRoutesProps(): ProgressRoutesProps {
  return {
    toLatestStep: Routes.locale.passwordReset.latestStep,
    label: "Reset your password",
    welcomeSteps: [],
    stepsToFillOut: [
      { path: Routes.locale.passwordReset.start, exact: true, component: Start },
      { path: Routes.locale.passwordReset.verify, exact: true, component: Verify },
      { path: Routes.locale.passwordReset.confirm, exact: true, component: Confirm }
    ],
    confirmationSteps: [
      { path: Routes.locale.passwordReset.done, exact: true, component: Done }
    ]
  };
}

function Start(props: {}) {
  return (
    <Page title="Having trouble logging in?">
      <h1 className="title is-4 is-spaced">Having trouble logging in?</h1>
      <p className="subtitle is-6">If you're having trouble logging in, we can reset your password. In order to do that, we'll need your phone number.</p>
      <LegacyFormSubmitter
        mutation={PasswordResetMutation}
        initialState={{phoneNumber: ''}}
        onSuccessRedirect={Routes.locale.passwordReset.verify}
      >
        {(ctx) => <>
          <PhoneNumberFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
          <div className="buttons jf-two-buttons">
            <BackButton to={Routes.locale.login} label="Back" />
            <NextButton isLoading={ctx.isLoading} />
          </div>
        </>}
      </LegacyFormSubmitter>
    </Page>
  );
}

function Verify(props: {}) {
  return (
    <Page title="Verify your phone number">
      <h1 className="title is-4 is-spaced">Verify your phone number</h1>
      <p className="subtitle is-6">We've just sent you a text message containing a verification code. Please enter it below.</p>
      <LegacyFormSubmitter
        mutation={PasswordResetVerificationCodeMutation}
        initialState={{code: ''}}
        onSuccessRedirect={Routes.locale.passwordReset.confirm}
      >
        {(ctx) => <>
          <TextualFormField label="Verification code" {...ctx.fieldPropsFor('code')} />
          <br/>
          <p>If you didn't receive a verification code, please email <OutboundLink href="mailto:support@justfix.nyc">support@justfix.nyc</OutboundLink>.</p>
          <div className="buttons jf-two-buttons">
            <BackButton to={Routes.locale.passwordReset.start} label="Back" />
            <NextButton isLoading={ctx.isLoading} />
          </div>
        </>}
      </LegacyFormSubmitter>
    </Page>
  );
}

function Confirm(props: {}) {
  return (
    <Page title="Set your new password">
      <h1 className="title is-4 is-spaced">Set your new password</h1>
      <p className="subtitle is-6">Hooray! The final step is to provide us with a new password.</p>
      <LegacyFormSubmitter
        mutation={PasswordResetConfirmMutation}
        initialState={{password: '', confirmPassword: ''}}
        onSuccessRedirect={Routes.locale.passwordReset.done}
      >
        {(ctx) => <>
          <TextualFormField type="password" label="New password" {...ctx.fieldPropsFor('password')} />
          <TextualFormField type="password" label="Confirm your new password" {...ctx.fieldPropsFor('confirmPassword')} />
          <br/>
          <div className="buttons jf-two-buttons">
            <BackButton to={Routes.locale.passwordReset.verify} label="Back" />
            <NextButton isLoading={ctx.isLoading} />
          </div>
        </>}
      </LegacyFormSubmitter>
    </Page>
  );
}

function Done(props: {}) {
  return (
    <Page title="Your password has been reset!">
      <h1 className="title is-4 is-spaced">Your password has been reset!</h1>
      <p className="subtitle is-6">You can now <Link to={Routes.locale.login}>log in with your new password</Link>.</p>
    </Page>
  );
}

const PasswordResetRoutes = buildProgressRoutesComponent(getPasswordResetRoutesProps);

export default PasswordResetRoutes;
