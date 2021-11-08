import loadable from "@loadable/component";
import { friendlyLoad, LoadingPage } from "../networking/loading-page";
import React from "react";
import { NotFound } from "../pages/not-found";
import { Route, RouteComponentProps } from "react-router-dom";
import { LALetterBuilderRoutes as Routes } from "./route-info";
import { LALetterBuilderHomepage } from "./homepage";
import { LALetterBuilderAboutPage } from "./about";
import { RouteSwitch } from "../util/route-switch";
import { AlternativeLogoutPage } from "../pages/logout-alt-page";
import { LALetterBuilderFormsRoutes } from "./letter-builder/routes";

const LoadableDevRoutes = loadable(
  () => friendlyLoad(import("../dev/routes")),
  {
    fallback: <LoadingPage />,
  }
);

export const LALetterBuilderRouteComponent: React.FC<RouteComponentProps> = (
  props
) => {
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  return (
    <RouteSwitch {...props} routes={Routes}>
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route
        path={Routes.locale.home}
        exact
        component={LALetterBuilderHomepage}
      />
      <Route
        path={Routes.locale.about}
        exact
        component={LALetterBuilderAboutPage}
      />
      <Route
        path={Routes.locale.logout}
        exact
        component={AlternativeLogoutPage}
      />
      <Route
        path={Routes.locale.letter.prefix}
        component={LALetterBuilderFormsRoutes}
      />
      <Route component={NotFound} />
    </RouteSwitch>
  );
};
