import { t } from "@lingui/macro";
import React from "react";
import { useContext } from "react";
import { AppContext } from "../app-context";
import { TextualFormField } from "../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { li18n } from "../i18n-lingui";
import { NorentPreferredNameMutation } from "../queries/NorentPreferredNameMutation";
import { NorentFullLegalNameMutation } from "../queries/NorentFullLegalNameMutation";
import { EditableInfo, SaveCancelButtons } from "../ui/editable-info";
import { makeAccountSettingsSection, WithAccountSettingsProps } from "./util";
import { optionalizeLabel } from "../forms/optionalize-label";

const PreferredNameField: React.FC<WithAccountSettingsProps> = ({ routes }) => {
  const { session } = useContext(AppContext);
  const sec = makeAccountSettingsSection(
    routes,
    "Preferred First Name (optional)",
    "preferredName"
  );

  return (
    <>
      {sec.heading}
      <p>The name you'd like people to call you by.</p>
      <EditableInfo
        {...sec}
        readonlyContent={session.preferredFirstName || ""}
        path={routes.preferredName}
      >
        <SessionUpdatingFormSubmitter
          mutation={NorentPreferredNameMutation}
          initialState={(s) => ({
            preferredFirstName: s.preferredFirstName || "",
          })}
          onSuccessRedirect={sec.homeLink}
        >
          {(ctx) => (
            <>
              <TextualFormField
                autoFocus
                {...ctx.fieldPropsFor("preferredFirstName")}
                label={optionalizeLabel(li18n._(t`Preferred first name`))}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

const LegalNameField: React.FC<WithAccountSettingsProps> = ({ routes }) => {
  const { session } = useContext(AppContext);
  const sec = makeAccountSettingsSection(routes, "Legal Name", "legalname");

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
          mutation={NorentFullLegalNameMutation}
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
                label={li18n._(t`Legal first name`)}
              />
              <TextualFormField
                {...ctx.fieldPropsFor("lastName")}
                label={li18n._(t`Legal last name`)}
              />
              <SaveCancelButtons isLoading={ctx.isLoading} {...sec} />
            </>
          )}
        </SessionUpdatingFormSubmitter>
      </EditableInfo>
    </>
  );
};

export const AboutYouAccountSettings: React.FC<WithAccountSettingsProps> = (
  props
) => {
  return (
    <>
      <h2 className="jf-account-settings-h2">About you</h2>
      <LegalNameField {...props} />
      <PreferredNameField {...props} />
    </>
  );
};
