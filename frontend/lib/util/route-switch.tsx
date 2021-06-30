import React from "react";
import { RouteComponentProps, Switch } from "react-router-dom";
import { RouteInfo } from "./route-util";
import { NotFound } from "../pages/not-found";

export const RouteSwitch: React.FC<
  RouteComponentProps & { routes: RouteInfo<unknown, unknown> }
> = (props) => {
  const { location } = props;

  if (!props.routes.routeMap.exists(location.pathname)) {
    return NotFound(props);
  }

  return <Switch location={location}>{props.children}</Switch>;
};
