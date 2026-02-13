import React, { useContext } from "react";
import { Route } from "react-router-dom";
import { t } from "@lingui/macro";
import { AppContext } from "../app-context";
import { li18n } from "../i18n-lingui";
import Page from "../ui/page";
import { RequireLogin } from "../util/require-login";
import { AboutYouAccountSettings } from "./about-you-settings";
import { ContactAccountSettings } from "./contact-settings";
import { NycAddressAccountSettings } from "./nyc-address-settings";
import { WithAccountSettingsProps } from "./util";

export const AccountSettingsRoutes: React.FC<WithAccountSettingsProps> = (
  props
) => {
  const { session } = useContext(AppContext);

  return (
    <Route path={props.routes.prefix}>
      <RequireLogin>
        <Page title={li18n._(t`Account settings`)} withHeading="big" className="content">
          <AboutYouAccountSettings {...props} />
          <ContactAccountSettings {...props} />
          {session.onboardingInfo?.borough && (
            <NycAddressAccountSettings {...props} />
          )}
        </Page>
      </RequireLogin>
    </Route>
  );
};
