import React from "react";
import { AppSiteProps } from "../app";
import { NorentRoutes as Routes } from "./routes";
import { RouteComponentProps, Switch, Route } from "react-router-dom";
import { NotFound } from "../pages/not-found";
import { NorentHomepage } from "./homepage";
import {
  LoadingPage,
  friendlyLoad,
  LoadingOverlayManager,
} from "../networking/loading-page";
import loadable from "@loadable/component";
import Navbar from "../ui/navbar";

const LoadableDevRoutes = loadable(() => friendlyLoad(import("../dev/dev")), {
  fallback: <LoadingPage />,
});

const NorentRoute: React.FC<RouteComponentProps> = (props) => {
  const { location } = props;
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  return (
    <Switch location={location}>
      <Route path={Routes.locale.home} exact component={NorentHomepage} />
      <Route path={Routes.dev.prefix} component={LoadableDevRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
};

const NorentSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    return (
      <>
        <Navbar />
        <section className="section">
          <div
            className="container"
            ref={ref}
            data-jf-is-noninteractive
            tabIndex={-1}
          >
            <LoadingOverlayManager>
              <Route component={NorentRoute} />
            </LoadingOverlayManager>
          </div>
        </section>
      </>
    );
  }
);

export default NorentSite;
