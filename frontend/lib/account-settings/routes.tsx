import { t } from "@lingui/macro";
import React, { useContext } from "react";
import { Link, Route, Switch } from "react-router-dom";
import { AppContext } from "../app-context";
import { TextualFormField } from "../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { li18n } from "../i18n-lingui";
import { NorentFullNameMutation } from "../queries/NorentFullNameMutation";
import { bulmaClasses } from "../ui/bulma";
import Page from "../ui/page";
import { AccountSettingsRouteInfo } from "./route-info";

export const AccountSettingsRoutes: React.FC<{
  routeInfo: AccountSettingsRouteInfo;
}> = ({ routeInfo: routes }) => {
  const { session } = useContext(AppContext);

  return (
    <Route path={routes.prefix}>
      <Page title="Account settings" withHeading="big" className="content">
        <h2>About you</h2>
        <h3>Name</h3>
        <p>This will be used in letters to your landlord or court documents.</p>
        <Switch>
          <Route path={routes.name} exact>
            <SessionUpdatingFormSubmitter
              mutation={NorentFullNameMutation}
              initialState={(s) => ({
                firstName: s.firstName || "",
                lastName: s.lastName || "",
              })}
              onSuccessRedirect={routes.home}
            >
              {(ctx) => (
                <>
                  <TextualFormField
                    {...ctx.fieldPropsFor("firstName")}
                    label={li18n._(t`First name`)}
                  />
                  <TextualFormField
                    {...ctx.fieldPropsFor("lastName")}
                    label={li18n._(t`Last name`)}
                  />
                  <button
                    type="submit"
                    className={bulmaClasses("button", "is-primary", {
                      "is-loading": ctx.isLoading,
                    })}
                  >
                    Save
                  </button>{" "}
                  <Link to={routes.home} className="button is-light">
                    Cancel
                  </Link>
                </>
              )}
            </SessionUpdatingFormSubmitter>
          </Route>
          <Route>
            <div className="jf-editable-setting">
              {session.firstName} {session.lastName}
            </div>
            <Link to={routes.name} className="button is-primary">
              Edit
            </Link>
          </Route>
        </Switch>
      </Page>
    </Route>
  );
};
