import loadable from "@loadable/component";
import { friendlyLoad, LoadingPage } from "../networking/loading-page";
import React from "react";
import { NotFound } from "../pages/not-found";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import { LALetterBuilderRoutes as Routes } from "./route-info";
import { LALetterBuilderHomepage } from "./homepage";
import { LALetterBuilderAboutPage } from "./about";

const LoadableDevRoutes = loadable(
  () => friendlyLoad(import("../dev/routes")),
  {
    fallback: <LoadingPage />,
  }
);

export const LALetterBuilderRouteComponent: React.FC<RouteComponentProps> = (
  props
) => {
  const { location } = props;
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  return (
    <Switch location={location}>
      <Route
        path={Routes.locale.home}
        exact
        component={LALetterBuilderHomepage}
      />
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route
        path={Routes.locale.about}
        exact
        component={LALetterBuilderAboutPage}
      />
      <Route component={NotFound} />
    </Switch>
  );
};
