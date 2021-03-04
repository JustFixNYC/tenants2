import { t } from "@lingui/macro";
import React from "react";
import { useContext } from "react";
import { AppContext } from "../app-context";
import { TextualFormField } from "../forms/form-fields";
import {
  formatPhoneNumber,
  PhoneNumberFormField,
} from "../forms/phone-number-form-field";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { li18n } from "../i18n-lingui";
import { NorentEmailMutation } from "../queries/NorentEmailMutation";
import { PhoneNumberMutation } from "../queries/PhoneNumberMutation";
import { EditableInfo, SaveCancelButtons } from "../ui/editable-info";
import { assertNotNull } from "../util/util";
import { AccountSettingsContext, useAccountSettingsSectionInfo } from "./util";

const PhoneNumberField: React.FC<{}> = () => {
  const sec = useAccountSettingsSectionInfo("Phone number", "phone");
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
  const sec = useAccountSettingsSectionInfo("Email address", "email");
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

export const ContactAccountSettings: React.FC<{}> = () => {
  return (
    <>
      <h2>Contact</h2>
      <PhoneNumberField />
      <EmailAddressField />
    </>
  );
};
