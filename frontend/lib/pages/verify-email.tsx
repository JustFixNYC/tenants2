import React, { useContext } from 'react';
import { SessionUpdatingFormSubmitter } from '../forms/session-updating-form-submitter';
import { SendVerificationEmailMutation } from '../queries/SendVerificationEmailMutation';
import { TextualFormField } from '../forms/form-fields';
import { ProgressButtons, BackButton } from '../buttons';
import { AppContext } from '../app-context';
import Page from '../page';
import { RouteComponentProps, withRouter, Redirect, Link } from 'react-router-dom';
import { getQuerystringVar } from '../querystring';
import { SessionPoller, SessionPollerProps } from '../session-poller';
import { GetEmailVerificationStatus } from '../queries/GetEmailVerificationStatus';
import { MiddleProgressStep } from '../progress/progress-step-route';
import { SimpleProgressiveEnhancement } from '../progressive-enhancement';

type VerifyEmailProps = RouteComponentProps<{}> & {
  prevUrl: string,
  nextUrl: string,
};

type VerifyEmailView = 'start'|'waiting'|'success';

const PollEmailVerificationStatus: React.FC<Pick<SessionPollerProps, 'ignoreErrors'>> = props => (
  <SessionPoller {...props} query={GetEmailVerificationStatus} intervalMS={2500} />
);

function getValidView(value: string|undefined): VerifyEmailView {
  switch (value) {
    case 'waiting':
    case 'success':
      return value;
    default:
      return 'start';
  }
}

const StartView: React.FC<VerifyEmailProps & {successUrl: string}> = props => {
  const {session} = useContext(AppContext);
  const userHasEmail = !!session.email;
  const {isEmailVerified} = useContext(AppContext).session;

  if (isEmailVerified) {
    return <Redirect to={props.successUrl} />;
  }

  return (
    <Page title="Looks like your account has not been verified" withHeading className="content">
      {/**
        * We're adding the following session poller as a progressive enhancement because
        * this page has a form field on it, and we don't want non-JS browsers to constantly
        * reload the page while the user may be typing in it.
        **/}
      <SimpleProgressiveEnhancement>
        <PollEmailVerificationStatus ignoreErrors />
      </SimpleProgressiveEnhancement>
      <SessionUpdatingFormSubmitter
        mutation={SendVerificationEmailMutation}
        initialState={s => ({email: s.email || ''})}
        onSuccessRedirect={props.nextUrl}
      >
        {ctx => <>
          {userHasEmail
            ? <>
                <p>Have you checked your email inbox? Check your spam folder just in case.</p>
                <p>If you can't find it, make sure your email address below is correct, and re-send the verification email.</p>
              </>
            : <p>We don't seem to have an email address associated with your account. Please provide a valid email address below.</p>}
          <TextualFormField {...ctx.fieldPropsFor('email')} label="Your email address" />
          <ProgressButtons back={props.prevUrl} isLoading={ctx.isLoading} nextLabel={userHasEmail ? "Re-send verification email" : "Send verification email"} />
        </>}
      </SessionUpdatingFormSubmitter>
    </Page>
  );
};

const WaitingView: React.FC<VerifyEmailProps> = props => {
  const title = "An email to verify your account is on its way"
  const {isEmailVerified} = useContext(AppContext).session;

  if (isEmailVerified) {
    return <Redirect to={props.nextUrl} />;
  }

  return (
    <Page title={title} className="content has-text-centered">
      <h1>{title}</h1>
      <p>
        Don't see one in your email inbox? Check your spam folder or go back and try again.
      </p>
      <PollEmailVerificationStatus />
      <BackButton to={props.prevUrl} label="Go back" />
    </Page>
  );
};

const SuccessView: React.FC<VerifyEmailProps> = props => {
  return (
    <Page title="Thank you for verifying your account!" withHeading>
      <div className="buttons jf-two-buttons">
        <BackButton to={props.prevUrl} />
        <Link className="button is-primary is-medium" to={props.nextUrl}>Next</Link>
      </div>
    </Page>
  );
};

const VerifyEmailWithoutRouter: React.FC<VerifyEmailProps> = props => {
  const myUrl = props.location.pathname;
  const view = getValidView(getQuerystringVar(props, 'v'));
  const toView = (newState: VerifyEmailView) => `${myUrl}?v=${newState}`;
  return (() => {
    switch (view) {
      case 'start':
        return <StartView {...props} nextUrl={toView('waiting')} successUrl={toView('success')} />;

      case 'waiting':
        return <WaitingView {...props} prevUrl={toView('start')} nextUrl={toView('success')} />;

      case 'success':
        return <SuccessView {...props} />;
    }
  })();
};

export const VerifyEmail = withRouter(VerifyEmailWithoutRouter);

export const VerifyEmailMiddleProgressStep = MiddleProgressStep(props => (
  <VerifyEmail nextUrl={props.nextStep} prevUrl={props.prevStep} />
));
