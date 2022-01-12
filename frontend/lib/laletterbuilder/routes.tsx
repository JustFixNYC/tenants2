import React from "react";
import { Switch, RouteComponentProps, Route } from "react-router-dom";

import loadable from "@loadable/component";

import { LoadingPage, friendlyLoad } from "../networking/loading-page";
import { AlternativeLogoutPage } from "../pages/logout-alt-page";
import { NotFound } from "../pages/not-found";
import { LaLetterBuilderAboutPage } from "./about";
import { LaLetterBuilderHomepage } from "./homepage";
import { LaLetterBuilderOnboardingRoutes } from "./letter-builder/routes";
import { LaLetterBuilderRoutes as Routes } from "./route-info";
import { HabitabilityRoutes } from "./letter-builder/habitability/routes";

const LoadableDevRoutes = loadable(
  () => friendlyLoad(import("../dev/routes")),
  {
    fallback: <LoadingPage />,
  }
);

export const LaLetterBuilderRouteComponent: React.FC<RouteComponentProps> = (
  props
) => {
  const { location } = props;
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  return (
    <Switch location={location}>
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route
        path={Routes.locale.home}
        exact
        component={LaLetterBuilderHomepage}
      />
      <Route
        path={Routes.locale.about}
        exact
        component={LaLetterBuilderAboutPage}
      />
      <Route
        path={Routes.locale.logout}
        exact
        component={AlternativeLogoutPage}
      />
      <Route
        path={Routes.locale.letter.prefix}
        component={LaLetterBuilderOnboardingRoutes}
      />
      <Route
        path={Routes.locale.letter.prefix} // check if we need to add /habitability
        component={HabitabilityRoutes}
      />
      <Route component={NotFound} />
    </Switch>
  );
};
