import { t } from "@lingui/macro";
import React from "react";
import { useContext } from "react";
import { AppContext } from "../app-context";
import { TextualFormField } from "../forms/form-fields";
import { SessionUpdatingFormSubmitter } from "../forms/session-updating-form-submitter";
import { li18n } from "../i18n-lingui";
import { NorentFullNameMutation } from "../queries/NorentFullNameMutation";
import { EditableInfo, SaveCancelButtons } from "../ui/editable-info";
import { makeAccountSettingsSection, WithAccountSettingsProps } from "./util";

const NameField: React.FC<WithAccountSettingsProps> = ({ routes }) => {
  const { session } = useContext(AppContext);
  const sec = makeAccountSettingsSection(routes, "Name", "name");

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

export const AboutYouAccountSettings: React.FC<WithAccountSettingsProps> = (
  props
) => {
  return (
    <>
      <h2>About you</h2>
      <NameField {...props} />
    </>
  );
};
