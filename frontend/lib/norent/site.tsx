import React from "react";
import { AppSiteProps } from "../app";
import { NorentRoutes as Routes } from "./routes";
import { RouteComponentProps, Switch, Route } from "react-router-dom";
import { NotFound } from "../pages/not-found";
import { NorentHomepage } from "./homepage";

const NorentRoute: React.FC<RouteComponentProps> = (props) => {
  const { location } = props;
  if (!Routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }
  return (
    <Switch location={location}>
      <Route path={Routes.locale.home} exact component={NorentHomepage} />
      <Route component={NotFound} />
    </Switch>
  );
};

const NorentSite = React.forwardRef<HTMLDivElement, AppSiteProps>(
  (props, ref) => {
    return (
      <section className="section">
        <div
          className="container"
          ref={ref}
          data-jf-is-noninteractive
          tabIndex={-1}
        >
          <Route component={NorentRoute} />
        </div>
      </section>
    );
  }
);

export default NorentSite;
