import React from "react";
import { Trans, t } from "@lingui/macro";
import { li18n } from "../i18n-lingui";

import Page from "../ui/page";
import { Link } from "react-router-dom";
import JustfixRoutes from "../justfix-route-info";
import { NextButton } from "../ui/buttons";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { LogoutMutation } from "../queries/LogoutMutation";
import { withAppContext, AppContextType } from "../app-context";
import { UnimpersonateWidget } from "../ui/impersonation";

export const LogoutPage = withAppContext((props: AppContextType) => {
  const displayName =
    props.session.preferredFirstName ||
    props.session.firstName ||
    props.session.phoneNumber;

  if (props.session.phoneNumber) {
    return (
      <Page title={li18n._(t`Sign out`)}>
        <div className="box">
          <h1 className="title">
            <Trans>Are you sure you want to sign out, {displayName}?</Trans>
          </h1>
          <SessionUpdatingFormSubmitter
            mutation={LogoutMutation}
            initialState={{}}
            // This looks odd but it's required for legacy POST to work.
            onSuccessRedirect={JustfixRoutes.locale.logout}
          >
            {(ctx) => (
              <NextButton
                isLoading={ctx.isLoading}
                label={li18n._(t`Yes, sign out`)}
              />
            )}
          </SessionUpdatingFormSubmitter>
          <UnimpersonateWidget />
        </div>
      </Page>
    );
  } else {
    return (
      <Page title={li18n._(t`Signed out`)}>
        <h1 className="title">
          <Trans>You are now signed out.</Trans>
        </h1>
        <p>
          <Link to={JustfixRoutes.locale.login}>
            <Trans>Sign back in</Trans>
          </Link>
        </p>
      </Page>
    );
  }
});
