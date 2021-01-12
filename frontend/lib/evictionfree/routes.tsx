import loadable from "@loadable/component";
import { friendlyLoad, LoadingPage } from "../networking/loading-page";
import React from "react";
import { NotFound } from "../pages/not-found";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import { EvictionFreeRoutes as Routes } from "./route-info";
import { EvictionFreeHomePage } from "./homepage";
import { EvictionFreeDeclarationBuilderRoutes } from "./declaration-builder/routes";
import { EvictionFreeLogoutPage } from "./log-out";

const LoadableDevRoutes = loadable(
  () => friendlyLoad(import("../dev/routes")),
  {
    fallback: <LoadingPage />,
  }
);

export const EvictionFreeRouteComponent: React.FC<RouteComponentProps> = (
  props
) => {
  const { location } = props;
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  return (
    <Switch location={location}>
      <Route path={Routes.locale.home} exact component={EvictionFreeHomePage} />
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route
        path={Routes.locale.declaration.prefix}
        component={EvictionFreeDeclarationBuilderRoutes}
      />
      <Route
        path={Routes.locale.logout}
        exact
        component={EvictionFreeLogoutPage}
      />
      <Route component={NotFound} />
    </Switch>
  );
};
