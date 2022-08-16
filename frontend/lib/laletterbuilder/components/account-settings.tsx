import React from "react";
import { Route } from "react-router-dom";
import Page from "../../ui/page";
import { RequireLogin } from "../../util/require-login";
import { AboutYouAccountSettings } from "../../account-settings/about-you-settings";
import { ContactAccountSettings } from "../../account-settings/contact-settings";
import { WithAccountSettingsProps } from "../../account-settings/util";
import { li18n } from "../../i18n-lingui";
import { t } from "@lingui/macro";

export const LaLetterBuilderAccountSettings: React.FC<WithAccountSettingsProps> = (
  props
) => {
  return (
    <Route path={props.routes.prefix}>
      <RequireLogin>
        <Page title={li18n._(t`Account settings`)} withHeading="big">
          <AboutYouAccountSettings {...props} />
          <ContactAccountSettings {...props} />
        </Page>
      </RequireLogin>
    </Route>
  );
};
