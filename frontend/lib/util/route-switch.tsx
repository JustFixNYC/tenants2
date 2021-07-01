import React from "react";
import { RouteComponentProps, Switch, Redirect } from "react-router-dom";
import { RouteInfo } from "./route-util";
import { NotFound } from "../pages/not-found";

/**
 * This is similar to React Router's `<Switch>` component, but
 * additionally checks to see if the current URL pathname exists
 * on the given `RouteInfo`.  If it does, we proceed as a normal
 * `<Switch>` component would.
 *
 * However, if the route _doesn't_ seem to exist, we do one of
 * two things:
 *
 *   1. If adding or removing a single `/` to the end of the pathname
 *      results in a known route, we return a redirect.
 *   2. Otherwise, we return a 404 page.
 */
export const RouteSwitch: React.FC<
  RouteComponentProps & { routes: RouteInfo<unknown, unknown> }
> = (props) => {
  const { location } = props;
  const { routeMap } = props.routes;

  if (!routeMap.exists(location.pathname)) {
    const redirect = routeMap.getClosestWithOrWithoutSlash(location.pathname);
    return redirect ? <Redirect to={redirect} /> : <NotFound {...props} />;
  }

  return <Switch location={location}>{props.children}</Switch>;
};
