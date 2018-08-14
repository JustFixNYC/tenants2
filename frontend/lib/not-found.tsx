import React from 'react';
import { RouteComponentProps } from 'react-router';
import { getAppStaticContext } from './app-static-context';


export function NotFound(props: RouteComponentProps<any>): JSX.Element {
  const staticContext = getAppStaticContext(props);
  if (staticContext) {
    staticContext.statusCode = 404;
  }
  return (
    <p>Sorry, the page you are looking for doesn't seem to exist.</p>
  );
}
