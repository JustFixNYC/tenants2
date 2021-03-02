import { t } from "@lingui/macro";
import React, { useContext } from "react";
import { Link, Route } from "react-router-dom";
import { AppContext } from "../app-context";
import { TextualFormField } from "../forms/form-fields";
import {
  formatPhoneNumber,
  PhoneNumberFormField,
} from "../forms/phone-number-form-field";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { li18n } from "../i18n-lingui";
import { NorentEmailMutation } from "../queries/NorentEmailMutation";
import { NorentFullNameMutation } from "../queries/NorentFullNameMutation";
import { PhoneNumberMutation } from "../queries/PhoneNumberMutation";
import { bulmaClasses } from "../ui/bulma";
import { EditableInfo } from "../ui/editable-info";
import Page from "../ui/page";
import { RequireLogin } from "../util/require-login";
import { assertNotNull } from "../util/util";
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

const PhoneNumberField: React.FC<{}> = () => {
  const sectionName = "Phone number";
  const { routes } = useContext(AccountSettingsContext);
  const { session } = useContext(AppContext);
  const phoneNumber = assertNotNull(session.phoneNumber);

  return (
    <>
      <h3>{sectionName}</h3>
      <p>This will be used to associate your information with you.</p>
      <EditableInfo
        name={sectionName}
        readonlyContent={formatPhoneNumber(phoneNumber)}
        path={routes.phoneNumber}
      >
        <SessionUpdatingFormSubmitter
          mutation={PhoneNumberMutation}
          initialState={{ phoneNumber }}
          onSuccessRedirect={routes.home}
        >
          {(ctx) => (
            <>
              <PhoneNumberFormField
                autoFocus
                {...ctx.fieldPropsFor("phoneNumber")}
                label={li18n._(t`Phone number`)}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const EmailAddressField: React.FC<{}> = () => {
  const sectionName = "Email address";
  const { routes } = useContext(AccountSettingsContext);
  const { session } = useContext(AppContext);
  const email = assertNotNull(session.email);

  return (
    <>
      <h3>{sectionName}</h3>
      <p>Where we will send you your documents.</p>
      <EditableInfo
        name={sectionName}
        readonlyContent={email}
        path={routes.email}
      >
        <SessionUpdatingFormSubmitter
          mutation={NorentEmailMutation}
          initialState={{ email }}
          onSuccessRedirect={routes.home}
        >
          {(ctx) => (
            <>
              <TextualFormField
                autoFocus
                type="email"
                {...ctx.fieldPropsFor("email")}
                label={li18n._(t`Email address`)}
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
      <RequireLogin>
        <Page title="Account settings" withHeading="big" className="content">
          <AccountSettingsContext.Provider value={{ routes }}>
            <h2>About you</h2>
            <NameField />
            <h2>Contact</h2>
            <PhoneNumberField />
            <EmailAddressField />
          </AccountSettingsContext.Provider>
        </Page>
      </RequireLogin>
    </Route>
  );
};
