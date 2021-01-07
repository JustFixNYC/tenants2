import React from "react";

import Page from "../ui/page";
import { Link } from "react-router-dom";
import JustfixRoutes from "../justfix-route-info";
import { NextButton } from "../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { LogoutMutation } from "../queries/LogoutMutation";
import { withAppContext, AppContextType } from "../app-context";

export const LogoutPage = withAppContext((props: AppContextType) => {
  if (props.session.phoneNumber) {
    return (
      <Page title="Sign out">
        <div className="box">
          <h1 className="title">
            Are you sure you want to sign out,{" "}
            {props.session.firstName || props.session.phoneNumber}?
          </h1>
          <SessionUpdatingFormSubmitter
            mutation={LogoutMutation}
            initialState={{}}
            // This looks odd but it's required for legacy POST to work.
            onSuccessRedirect={JustfixRoutes.locale.logout}
          >
            {(ctx) => (
              <NextButton isLoading={ctx.isLoading} label="Yes, sign out" />
            )}
          </SessionUpdatingFormSubmitter>
        </div>
      </Page>
    );
  } else {
    return (
      <Page title="Signed out">
        <h1 className="title">You are now signed out.</h1>
        <p>
          <Link to={JustfixRoutes.locale.login}>Sign back in</Link>
        </p>
      </Page>
    );
  }
});
