import React from "react";
import { RouteComponentProps } from "react-router";
import { getAppStaticContext } from "../app-static-context";
import Page from "../ui/page";
import { Trans } from "@lingui/macro";

export function NotFound(props: RouteComponentProps<any>): JSX.Element {
  const staticContext = getAppStaticContext(props);
  if (staticContext) {
    staticContext.statusCode = 404;
  }
  return (
    <Page title="Not found">
      <h1 className="title">
        <Trans>Alas.</Trans>
      </h1>
      <p>
        <Trans>
          Sorry, the page you are looking for doesn't seem to exist.
        </Trans>
      </p>
    </Page>
  );
}
