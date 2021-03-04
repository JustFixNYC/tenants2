import { t } from "@lingui/macro";
import React, { useContext } from "react";
import { Link, Route } from "react-router-dom";
import {
  getLeaseChoiceLabels,
  isLeaseChoice,
  LeaseChoices,
} from "../../../common-data/lease-choices";
import { AppContext } from "../app-context";
import { toDjangoChoices } from "../common-data";
import { AddressAndBoroughField } from "../forms/address-and-borough-form-field";
import { AptNumberFormFields } from "../forms/apt-number-form-fields";
import { RadiosFormField, TextualFormField } from "../forms/form-fields";
import {
  formatPhoneNumber,
  PhoneNumberFormField,
} from "../forms/phone-number-form-field";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { li18n } from "../i18n-lingui";
import { LeaseTypeMutation } from "../queries/LeaseTypeMutation";
import { NorentEmailMutation } from "../queries/NorentEmailMutation";
import { NorentFullNameMutation } from "../queries/NorentFullNameMutation";
import { NycAddressMutation } from "../queries/NycAddressMutation";
import { PhoneNumberMutation } from "../queries/PhoneNumberMutation";
import { bulmaClasses } from "../ui/bulma";
import { EditableInfo } from "../ui/editable-info";
import Page from "../ui/page";
import { RequireLogin } from "../util/require-login";
import { pathWithHash } from "../util/route-util";
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

function useSectionInfo(name: string, hashId: string) {
  const { routes } = useContext(AccountSettingsContext);
  return {
    name,
    hashId,
    homeLink: pathWithHash(routes.home, hashId),
    heading: <h3 id={hashId}>{name}</h3>,
  };
}

const SaveCancelButtons: React.FC<{ isLoading: boolean; homeLink: string }> = ({
  isLoading,
  homeLink,
}) => {
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
      <Link to={homeLink} className="button is-light">
        Cancel
      </Link>
    </>
  );
};

const NameField: React.FC<{}> = () => {
  const { routes } = useContext(AccountSettingsContext);
  const { session } = useContext(AppContext);
  const sec = useSectionInfo("Name", "name");

  return (
    <>
      {sec.heading}
      <p>This will be used in letters to your landlord or court documents.</p>
      <EditableInfo
        {...sec}
        readonlyContent={`${session.firstName} ${session.lastName}`}
        path={routes.name}
      >
        <SessionUpdatingFormSubmitter
          mutation={NorentFullNameMutation}
          initialState={(s) => ({
            firstName: s.firstName || "",
            lastName: s.lastName || "",
          })}
          onSuccessRedirect={sec.homeLink}
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
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const PhoneNumberField: React.FC<{}> = () => {
  const sec = useSectionInfo("Phone number", "phone");
  const { routes } = useContext(AccountSettingsContext);
  const { session } = useContext(AppContext);
  const phoneNumber = assertNotNull(session.phoneNumber);

  return (
    <>
      {sec.heading}
      <p>This will be used to associate your information with you.</p>
      <EditableInfo
        {...sec}
        readonlyContent={formatPhoneNumber(phoneNumber)}
        path={routes.phoneNumber}
      >
        <SessionUpdatingFormSubmitter
          mutation={PhoneNumberMutation}
          initialState={{ phoneNumber }}
          onSuccessRedirect={sec.homeLink}
        >
          {(ctx) => (
            <>
              <PhoneNumberFormField
                autoFocus
                {...ctx.fieldPropsFor("phoneNumber")}
                label={li18n._(t`Phone number`)}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const EmailAddressField: React.FC<{}> = () => {
  const sec = useSectionInfo("Email address", "email");
  const { routes } = useContext(AccountSettingsContext);
  const { session } = useContext(AppContext);
  const email = assertNotNull(session.email);

  return (
    <>
      {sec.heading}
      <p>Where we will send you your documents.</p>
      <EditableInfo {...sec} readonlyContent={email} path={routes.email}>
        <SessionUpdatingFormSubmitter
          mutation={NorentEmailMutation}
          initialState={{ email }}
          onSuccessRedirect={sec.homeLink}
        >
          {(ctx) => (
            <>
              <TextualFormField
                autoFocus
                type="email"
                {...ctx.fieldPropsFor("email")}
                label={li18n._(t`Email address`)}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const LeaseTypeField: React.FC<{}> = () => {
  const sec = useSectionInfo("Lease type", "lease");
  const { routes } = useContext(AccountSettingsContext);
  const { session } = useContext(AppContext);
  const leaseType = session.onboardingInfo?.leaseType || "";
  let leaseTypeLabel = "";
  if (isLeaseChoice(leaseType)) {
    leaseTypeLabel = getLeaseChoiceLabels()[leaseType];
  }

  return (
    <>
      {sec.heading}
      <EditableInfo
        {...sec}
        readonlyContent={leaseTypeLabel}
        path={routes.leaseType}
      >
        <SessionUpdatingFormSubmitter
          mutation={LeaseTypeMutation}
          onSuccessRedirect={sec.homeLink}
          initialState={{ leaseType }}
        >
          {(ctx) => (
            <>
              <RadiosFormField
                {...ctx.fieldPropsFor("leaseType")}
                autoFocus
                choices={toDjangoChoices(LeaseChoices, getLeaseChoiceLabels())}
                label="Lease type"
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const NycAddressField: React.FC<{}> = () => {
  const sec = useSectionInfo("Your address", "address");
  const { routes } = useContext(AccountSettingsContext);
  const oi = assertNotNull(useContext(AppContext).session.onboardingInfo);

  return (
    <>
      {sec.heading}
      <EditableInfo
        {...sec}
        readonlyContent={oi.fullMailingAddress}
        path={routes.address}
      >
        <SessionUpdatingFormSubmitter
          mutation={NycAddressMutation}
          initialState={{
            borough: assertNotNull(oi.borough),
            aptNumber: oi.aptNumber,
            noAptNumber: !oi.aptNumber,
            address: oi.address,
          }}
          onSuccessRedirect={sec.homeLink}
        >
          {(ctx) => (
            <>
              <AddressAndBoroughField
                autoFocus
                addressProps={ctx.fieldPropsFor("address")}
                boroughProps={ctx.fieldPropsFor("borough")}
              />
              <AptNumberFormFields
                aptNumberProps={ctx.fieldPropsFor("aptNumber")}
                noAptNumberProps={ctx.fieldPropsFor("noAptNumber")}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const NycAddressSettings: React.FC<{}> = () => {
  return (
    <>
      <h2>Address</h2>
      <NycAddressField />
      <LeaseTypeField />
    </>
  );
};

export const AccountSettingsRoutes: React.FC<{
  routeInfo: AccountSettingsRouteInfo;
}> = ({ routeInfo: routes }) => {
  const { session } = useContext(AppContext);

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
            {session.onboardingInfo?.borough && <NycAddressSettings />}
          </AccountSettingsContext.Provider>
        </Page>
      </RequireLogin>
    </Route>
  );
};
