import React from 'react';
import querystring from 'querystring';

import Page from '../page';
import Routes, { routeMap } from '../routes';
import { SessionUpdatingFormSubmitter } from '../forms';
import { LoginMutation } from '../queries/LoginMutation';
import { TextualFormField } from '../form-fields';
import { NextButton } from '../buttons';
import { LoginInput } from '../queries/globalTypes';
import { RouteComponentProps } from 'react-router';
import { withAppContext, AppContextType } from '../app-context';
import { History } from 'history';

const NEXT = 'next';

const initialState: LoginInput = {
  phoneNumber: '',
  password: ''
};

export interface LoginFormProps {
  next: string;
}

export function performRedirect(redirect: string, history: History) {
  if (routeMap.exists(redirect)) {
    history.push(redirect);
  } else {
    // This isn't a route we can serve from this single-page app,
    // but it might be something our underlying Django app can
    // serve, so force a browser refresh.
    window.location.href = redirect;
  }
}

export class LoginForm extends React.Component<LoginFormProps> {
  render() {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LoginMutation}
        initialState={initialState}
        onSuccessRedirect={this.props.next}
        performRedirect={performRedirect}
      >
        {(ctx) => (
          <React.Fragment>
            <input type="hidden" name={NEXT} value={this.props.next} />
            <TextualFormField label="Phone number" {...ctx.fieldPropsFor('phoneNumber')} />
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
 * This is intentionally structured as a subset of react-router's
 * router context, to make it easy to interoperate with.
 */
type LocationSearchInfo = {
  location: {
    search: string
  }
};

/**
 * Return the value of the last-defined key in the given querystring.
 */
export function getQuerystringVar(routeInfo: LocationSearchInfo, name: string): string|undefined {
  let val = querystring.parse(routeInfo.location.search.slice(1))[name];

  if (Array.isArray(val)) {
    val = val[val.length - 1];
  }

  return val;
}

/**
 * This is intentionally structured as a subset of our app context,
 * to make it easy to interoperate with.
 */
type HttpPostInfo = {
  legacyFormSubmission?: {
    POST: Partial<{ [key: string]: string }>;
  }
};

/**
 * If this is a POST, returns the last value of the given key, or undefined if
 * not present.
 * 
 * Otherwise, returns the last-defined key in the given querystring.
 */
export function getPostOrQuerystringVar(info: LocationSearchInfo & HttpPostInfo, name: string): string|undefined {
  if (info.legacyFormSubmission) {
    return info.legacyFormSubmission.POST[name];
  }
  return getQuerystringVar(info, name);
}

const LoginPage = withAppContext((props: RouteComponentProps<any> & AppContextType): JSX.Element => {
  let next = getPostOrQuerystringVar(props, NEXT) || Routes.home;
  // TODO: Validate the next URL.

  return (
    <Page title="Sign in">
      <h1 className="title">Sign in</h1>
      <LoginForm next={next} />
    </Page>
  );
});

export default LoginPage;
