import loadable from "@loadable/component";
import { friendlyLoad, LoadingPage } from "../networking/loading-page";
import React from "react";
import { NotFound } from "../pages/not-found";
import { Redirect, Route, RouteComponentProps } from "react-router-dom";
import { EvictionFreeRoutes as Routes } from "./route-info";
import { EvictionFreeHomePage } from "./homepage";
import { EvictionFreeDeclarationBuilderRoutes } from "./declaration-builder/routes";
import { AlternativeLogoutPage } from "../pages/logout-alt-page";
import { EvictionFreeAboutPage } from "./about";
import { EvictionFreeFaqsPage } from "./faqs";
import { createHtmlEmailStaticPageRoutes } from "../static-page/routes";
import { EvictionFreeDeclarationEmailToUserStaticPage } from "./declaration-email-to-user";
import { EvictionFreeDeclarationEmailToHousingCourtStaticPage } from "./declaration-email-to-housing-court";
import { EvictionFreeDeclarationEmailToLandlordStaticPage } from "./declaration-email-to-landlord";
import { createEvictionFreeUnsupportedLocaleRoutes } from "./unsupported-locale";
import { RouteSwitch } from "../util/route-switch";

const LoadableDevRoutes = loadable(
  () => friendlyLoad(import("../dev/routes")),
  {
    fallback: <LoadingPage />,
  }
);

const LoginPageRedirect = () => (
  <Redirect to={Routes.locale.declaration.phoneNumber} />
);

export const EvictionFreeRouteComponent: React.FC<RouteComponentProps> = (
  props
) => {
  return (
    <RouteSwitch {...props} routes={Routes}>
      <Route path={Routes.locale.home} exact component={EvictionFreeHomePage} />
      <Route
        path={Routes.locale.about}
        exact
        component={EvictionFreeAboutPage}
      />
      <Route path={Routes.locale.faqs} exact component={EvictionFreeFaqsPage} />
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route
        path={Routes.locale.declaration.prefix}
        component={EvictionFreeDeclarationBuilderRoutes}
      />
      <Route path={Routes.locale.login} component={LoginPageRedirect} />
      <Route
        path={Routes.locale.logout}
        exact
        component={AlternativeLogoutPage}
      />
      {createHtmlEmailStaticPageRoutes(
        Routes.locale.declarationEmailToUser,
        EvictionFreeDeclarationEmailToUserStaticPage
      )}
      {createHtmlEmailStaticPageRoutes(
        Routes.locale.declarationEmailToLandlord,
        EvictionFreeDeclarationEmailToLandlordStaticPage
      )}
      {createHtmlEmailStaticPageRoutes(
        Routes.locale.declarationEmailToHousingCourt,
        EvictionFreeDeclarationEmailToHousingCourtStaticPage
      )}
      {createEvictionFreeUnsupportedLocaleRoutes()}
      <Route component={NotFound} />
    </RouteSwitch>
  );
};
