import React from "react";
import { RouteComponentProps } from "react-router";
import { getAppStaticContext } from "../app-static-context";
import Page from "../ui/page";

export function NotFound(props: RouteComponentProps<any>): JSX.Element {
  const staticContext = getAppStaticContext(props);
  if (staticContext) {
    staticContext.statusCode = 404;
  }
  return (
    <Page title="Not found">
      <h1 className="title">Alas.</h1>
      <p>Sorry, the page you are looking for doesn't seem to exist.</p>
    </Page>
  );
}
