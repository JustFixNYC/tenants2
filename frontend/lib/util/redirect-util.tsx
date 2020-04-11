import React from 'react';
import { RouteComponentProps, Redirect } from "react-router";

/**
 * Return a React component that redirects to the given path,
 * passing along the current search query as well.
 */
export function createRedirectWithSearch(to: string) {
  return (props: RouteComponentProps) => <Redirect to={{
    pathname: to,
    search: props.location.search
  }}/>;
}
