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
        <div className="box">
          <h1 className="title">Are you sure you want to sign out?</h1>
          <SessionUpdatingFormSubmitter
            mutation={LogoutMutation}
            initialState={{}}
            // This looks odd but it's required for legacy POST to work.
            onSuccessRedirect={Routes.locale.logout}
          >{(ctx) => (
              <NextButton isLoading={ctx.isLoading} label="Yes, sign out" />
          )}</SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  } else {
    return (
      <Page title="Signed out">
        <h1 className="title">You are now signed out.</h1>
        <p><Link to={Routes.locale.login}>Sign back in</Link></p>
      </Page>
    );
  }
});
