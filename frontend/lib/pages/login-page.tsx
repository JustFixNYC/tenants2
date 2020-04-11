import React, { useContext } from 'react';

import Page from '../ui/page';
import Routes from '../routes';
import { SessionUpdatingFormSubmitter } from '../forms/session-updating-form-submitter';
import { LoginMutation, BlankLoginInput } from '../queries/LoginMutation';
import { TextualFormField } from '../forms/form-fields';
import { NextButton } from '../ui/buttons';
import { RouteComponentProps } from 'react-router';
import { withAppContext, AppContextType, AppContext } from '../app-context';
import { History } from 'history';
import hardRedirect from '../hard-redirect';
import { PhoneNumberFormField } from '../forms/phone-number-form-field';
import { assertNotNull } from '../util/util';
import { getPostOrQuerystringVar } from '../util/querystring';
import { Link } from 'react-router-dom';
import { getPostOnboardingURL } from '../onboarding/signup-intent';

export const NEXT = 'next';

export interface LoginFormProps {
  next: string;
  redirectToLegacyAppURL: string;
}

/**
 * Based on the type of URL we're given, perform either a "hard" redirect
 * whereby we leave our single-page application (SPA), or a "soft" redirect,
 * in which we stay in our SPA.
 */
export function performHardOrSoftRedirect(redirect: string, history: History) {
  if (Routes.routeMap.exists(redirect)) {
    history.push(redirect);
  } else {
    // This isn't a route we can serve from this single-page app,
    // but it might be something our underlying Django app can
    // serve, so force a browser refresh.
    hardRedirect(redirect);
  }
}

export class LoginForm extends React.Component<LoginFormProps> {
  render() {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LoginMutation}
        initialState={BlankLoginInput}
        onSuccessRedirect={(output, input) => {
          if (assertNotNull(output.session).prefersLegacyApp) {
            return this.props.redirectToLegacyAppURL;
          }
          return this.props.next;
        }}
        performRedirect={performHardOrSoftRedirect}
      >
        {(ctx) => (
          <React.Fragment>
            <input type="hidden" name={NEXT} value={this.props.next} />
            <PhoneNumberFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
            <TextualFormField label="Password" type="password" {...ctx.fieldPropsFor('password')} />
            <div className="field">
              <NextButton isLoading={ctx.isLoading} label="Sign in" />
            </div>
          </React.Fragment>
        )}
      </SessionUpdatingFormSubmitter>
    );
  }
}

/**
 * Given a URL passed to us by an untrusted party, ensure that it has
 * the given origin, to mitigate the possibility of us being used as
 * an open redirect: http://cwe.mitre.org/data/definitions/601.html.
 */
export function absolutifyURLToOurOrigin(url: string, origin: string): string {
  if (url.indexOf(`${origin}/`) === 0) {
    return url;
  }
  if (url[0] !== '/') {
    url = `/${url}`;
  }
  return `${origin}${url}`;
}

const LoginPage = withAppContext((props: RouteComponentProps<any> & AppContextType): JSX.Element => {
  const appContext = useContext(AppContext);
  let next = absolutifyURLToOurOrigin(
    getPostOrQuerystringVar(props, NEXT) || getPostOnboardingURL(appContext.session.onboardingInfo),
    props.server.originURL
  );

  return (
    <Page title="Sign in">
      <div className="box">
        <h1 className="title">Sign in</h1>
        <LoginForm next={next} redirectToLegacyAppURL={props.server.redirectToLegacyAppURL} />
        <br/>
        <div className="content">
          <p>
            If you have trouble logging in, you can <Link to={Routes.locale.passwordReset.start}>reset your password</Link>.
          </p>
          <p>
            Don't have an account yet? You can sign up for one by composing a <Link to={Routes.locale.loc.splash}>Letter of Complaint</Link> or starting an <Link to={Routes.locale.hp.latestStep}>HP Action</Link>!
          </p>
        </div>
      </div>
    </Page>
  );
});

export default LoginPage;
