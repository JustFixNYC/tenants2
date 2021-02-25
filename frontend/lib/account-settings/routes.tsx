import { t } from "@lingui/macro";
import React, { useContext, useRef } from "react";
import { Link, Route, useLocation } from "react-router-dom";
import { AppContext } from "../app-context";
import { TextualFormField } from "../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { li18n } from "../i18n-lingui";
import { NorentFullNameMutation } from "../queries/NorentFullNameMutation";
import { bulmaClasses } from "../ui/bulma";
import Page from "../ui/page";
import { useAutoFocus } from "../ui/use-auto-focus";
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

  useAutoFocus(ref, autoFocus);

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

/**
 * A section of information that starts out read-only, but
 * becomes editable once the user activates an "edit" button.
 *
 * The "edit" button is actually just a link to a URL that
 * toggles the editability of the content. This is done to
 * ensure that the functionality works in non-JS contexts.
 */
const EditableInfo: React.FC<{
  /**
   * The path that clicking the "edit" button should take the
   * user to. This should be a path in which this button will
   * still be rendered without needing to be re-mounted.
   */
  path: string;

  /**
   * The name of the information in this area, used for
   * providing an accessible label for the "edit" button
   * (there may be multiple "edit" buttons on the page, so
   * we want to provide more context for screen reader users).
   */
  name: string;

  /** The read-only version of the content. */
  readonlyContent: string | JSX.Element;

  /**
   * The content shown when the user clicks the "edit" button.
   * This content is responsible for focusing itself on mount
   * to ensure that user focus isn't lost, as the "edit" button
   * will have disappeared.
   *
   * This content can also contain a link back to the URL with
   * the read-only version of the content, which is expected
   * to be a subset of the `path` prop.  Once this is navigated to,
   * the `children` will be unmounted and this component will ensure
   * that the "edit" button is focused.
   */
  children: any;
}> = (props) => {
  const { pathname } = useLocation();
  const prevPathname = usePrevious(pathname);
  let autoFocusEditLink =
    pathname !== prevPathname &&
    prevPathname === props.path &&
    // We additionally want to make sure that we only auto-focus
    // the edit link in situations where we are sure nothing else
    // wants focus, which by convention will be if our pathname
    // starts with the current pathname (e.g. if the user just
    // navigated from `/foo/edit-name` to `/foo`, rather than from
    // `/foo/edit-name` to `/foo/edit-phone-number`).
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
