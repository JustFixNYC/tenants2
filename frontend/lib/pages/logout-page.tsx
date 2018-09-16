import React from 'react';

import Page from '../page';
import { Link } from 'react-router-dom';
import Routes from '../routes';
import { NextButton } from '../buttons';
import { SessionUpdatingFormSubmitter } from '../forms';
import { LogoutMutation } from '../queries/LogoutMutation';
import { withAppContext, AppContextType } from '../app-context';


export const LogoutPage = withAppContext((props: AppContextType) => {
  if (props.session.phoneNumber) {
    return (
      <Page title="Sign out">
        <h1 className="title">Are you sure you want to sign out?</h1>
        <SessionUpdatingFormSubmitter
          mutation={LogoutMutation}
          initialState={{}}
        >{(ctx) => (
            <NextButton isLoading={ctx.isLoading} label="Yes, sign out" />
        )}</SessionUpdatingFormSubmitter>
      </Page>
    );
  } else {
    return (
      <Page title="Signed out">
        <h1 className="title">You are now signed out.</h1>
        <p><Link to={Routes.login}>Sign back in</Link></p>
      </Page>
    );
  }
});
