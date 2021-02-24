import { t } from "@lingui/macro";
import React, { useContext, useEffect, useRef } from "react";
import { Link, Route, useLocation } from "react-router-dom";
import { AppContext } from "../app-context";
import { TextualFormField } from "../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { li18n } from "../i18n-lingui";
import { NorentFullNameMutation } from "../queries/NorentFullNameMutation";
import { bulmaClasses } from "../ui/bulma";
import Page from "../ui/page";
import { usePrevious } from "../util/use-previous";
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

const EditLink: React.FC<{
  to: string;
  ariaLabel: string;
  autoFocus?: boolean;
}> = ({ to, ariaLabel, autoFocus }) => {
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  return (
    <Link
      to={to}
      className="button is-primary"
      aria-label={ariaLabel}
      ref={ref}
    >
      Edit
    </Link>
  );
};

const EditableInfo: React.FC<{
  path: string;
  name: string;
  readonlyContent: string | JSX.Element;
  children: any;
}> = (props) => {
  const { pathname } = useLocation();
  const prevPathname = usePrevious(pathname);
  let autoFocusEditLink =
    pathname !== prevPathname &&
    prevPathname === props.path &&
    props.path.startsWith(pathname);

  return pathname === props.path ? (
    props.children
  ) : (
    <>
      <div className="jf-editable-setting">{props.readonlyContent}</div>
      <EditLink
        to={props.path}
        autoFocus={autoFocusEditLink}
        ariaLabel={`Edit ${props.name}`}
      />
    </>
  );
};

const NameField: React.FC<{}> = () => {
  const { routes } = useContext(AccountSettingsContext);
  const { session } = useContext(AppContext);
  const sectionName = "Name";

  return (
    <>
      <h3>{sectionName}</h3>
      <p>This will be used in letters to your landlord or court documents.</p>
      <EditableInfo
        name={sectionName}
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
    </>
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
          <NameField />
        </AccountSettingsContext.Provider>
      </Page>
    </Route>
  );
};
