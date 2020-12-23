import { RouteComponentProps } from "react-router-dom";
import { ROUTE_PREFIX } from "../util/route-util";

export type IssuesRouteInfo = {
  [ROUTE_PREFIX]: string;
  home: string;
  modal: string;
  area: {
    parameterizedRoute: string;
    create: (area: string) => string;
  };
};

export type IssuesRouteAreaProps = RouteComponentProps<{ area: string }>;

export function createIssuesRouteInfo(prefix: string): IssuesRouteInfo {
  return {
    [ROUTE_PREFIX]: prefix,
    home: prefix,
    modal: `${prefix}/covid-risk-modal`,
    area: {
      parameterizedRoute: `${prefix}/:area`,
      create: (area: string) => `${prefix}/${area}`,
    },
  };
}
