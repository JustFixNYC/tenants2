import React, { useContext } from "react";
import { Route } from "react-router-dom";
import { AppContext } from "../app-context";
import Page from "../ui/page";
import { RequireLogin } from "../util/require-login";
import { AboutYouAccountSettings } from "./about-you-settings";
import { ContactAccountSettings } from "./contact-settings";
import { NycAddressAccountSettings } from "./nyc-address-settings";
import { AccountSettingsRouteInfo } from "./route-info";
import { AccountSettingsContext } from "./util";

export const AccountSettingsRoutes: React.FC<{
  routeInfo: AccountSettingsRouteInfo;
}> = ({ routeInfo: routes }) => {
  const { session } = useContext(AppContext);

  return (
    <Route path={routes.prefix}>
      <RequireLogin>
        <Page title="Account settings" withHeading="big" className="content">
          <AccountSettingsContext.Provider value={{ routes }}>
            <AboutYouAccountSettings />
            <ContactAccountSettings />
            {session.onboardingInfo?.borough && <NycAddressAccountSettings />}
          </AccountSettingsContext.Provider>
        </Page>
      </RequireLogin>
    </Route>
  );
};
