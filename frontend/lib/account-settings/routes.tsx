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

type AccountSettingsContextType = {
  routes: AccountSettingsRouteInfo;
};

const AccountSettingsContext = React.createContext<AccountSettingsContextType>({
  get routes(): AccountSettingsRouteInfo {
    throw new Error("AccountSettingsContext not set!");
  },
});

const SaveCancelButtons: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  const { routes } = useContext(AccountSettingsContext);

  return (
    <>
      <button
        type="submit"
        className={bulmaClasses("button", "is-primary", {
          "is-loading": isLoading,
        })}
      >
        Save
      </button>{" "}
      <Link to={routes.home} className="button is-light">
        Cancel
      </Link>
    </>
  );
};

const EditLink: React.FC<{ to: string }> = ({ to }) => (
  <Link to={to} className="button is-primary">
    Edit
  </Link>
);

const EditableInfo: React.FC<{
  path: string;
  readonlyContent: string | JSX.Element;
  children: any;
}> = (props) => {
  return (
    <Switch>
      <Route path={props.path} exact>
        {props.children}
      </Route>
      <Route>
        <div className="jf-editable-setting">{props.readonlyContent}</div>
        <EditLink to={props.path} />
      </Route>
    </Switch>
  );
};

const NameField: React.FC<{}> = () => {
  const { routes } = useContext(AccountSettingsContext);
  const { session } = useContext(AppContext);

  return (
    <EditableInfo
      readonlyContent={`${session.firstName} ${session.lastName}`}
      path={routes.name}
    >
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
              autoFocus
              {...ctx.fieldPropsFor("firstName")}
              label={li18n._(t`First name`)}
            />
            <TextualFormField
              {...ctx.fieldPropsFor("lastName")}
              label={li18n._(t`Last name`)}
            />
            <SaveCancelButtons isLoading={ctx.isLoading} />
          </>
        )}
      </SessionUpdatingFormSubmitter>
    </EditableInfo>
  );
};

export const AccountSettingsRoutes: React.FC<{
  routeInfo: AccountSettingsRouteInfo;
}> = ({ routeInfo: routes }) => {
  return (
    <Route path={routes.prefix}>
      <Page title="Account settings" withHeading="big" className="content">
        <AccountSettingsContext.Provider value={{ routes }}>
          <h2>About you</h2>
          <h3>Name</h3>
          <p>
            This will be used in letters to your landlord or court documents.
          </p>
          <NameField />
        </AccountSettingsContext.Provider>
      </Page>
    </Route>
  );
};
