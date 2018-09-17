import React from 'react';
import querystring from 'querystring';

import Page from '../page';
import Routes from '../routes';
import { SessionUpdatingFormSubmitter } from '../forms';
import { LoginMutation } from '../queries/LoginMutation';
import { TextualFormField } from '../form-fields';
import { NextButton } from '../buttons';
import { LoginInput } from '../queries/globalTypes';
import { RouteComponentProps } from 'react-router';
import { withAppContext, AppContextType } from '../app-context';

const NEXT = 'next';

const initialState: LoginInput = {
  phoneNumber: '',
  password: ''
};

export interface LoginFormProps {
  next: string;
}

export class LoginForm extends React.Component<LoginFormProps> {
  render() {
    return (
      <SessionUpdatingFormSubmitter
        mutation={LoginMutation}
        initialState={initialState}
        onSuccessRedirect={this.props.next}
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

function getQuerystringVar(routeInfo: RouteComponentProps<any>, name: string): string|undefined {
  let val = querystring.parse(routeInfo.location.search.slice(1))[name];

  if (Array.isArray(val)) {
    val = val[val.length - 1];
  }

  return val;
}

export interface LoginPageProps {}

const LoginPage = withAppContext((props: RouteComponentProps<any> & AppContextType): JSX.Element => {
  let next = Routes.home;
  if (props.legacyFormSubmission) {
    next = props.legacyFormSubmission.POST[NEXT] || next;
  } else {
    next = getQuerystringVar(props, NEXT) || next;
  }
  // TODO: Validate the next URL.

  return (
    <Page title="Sign in">
      <h1 className="title">Sign in</h1>
      <LoginForm next={next} />
    </Page>
  );
});

export default LoginPage;
