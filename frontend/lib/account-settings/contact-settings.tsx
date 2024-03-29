import { t, Trans } from "@lingui/macro";
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
import { assertNotNull } from "@justfixnyc/util";
import { makeAccountSettingsSection, WithAccountSettingsProps } from "./util";

const PhoneNumberField: React.FC<WithAccountSettingsProps> = ({ routes }) => {
  const sec = makeAccountSettingsSection(
    routes,
    li18n._(t`Phone number`),
    "phone"
  );
  const { session } = useContext(AppContext);
  const phoneNumber = assertNotNull(session.phoneNumber);

  return (
    <>
      {sec.heading}
      <p>
        <Trans>Used for logging in to your account</Trans>
      </p>
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
                labelHint={li18n._(
                  t`Please use a number that can receive text messages.`
                )}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const EmailAddressField: React.FC<WithAccountSettingsProps> = ({ routes }) => {
  const sec = makeAccountSettingsSection(
    routes,
    li18n._(t`Email address`),
    "email"
  );
  const { session } = useContext(AppContext);
  const email = assertNotNull(session.email);

  return (
    <>
      {sec.heading}
      <p>
        <Trans>Where we will send you your documents.</Trans>
      </p>
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

export const ContactAccountSettings: React.FC<WithAccountSettingsProps> = (
  props
) => {
  return (
    <>
      <h2 className="jf-account-settings-h2">
        <Trans>Contact</Trans>
      </h2>
      <PhoneNumberField {...props} />
      <EmailAddressField {...props} />
    </>
  );
};
